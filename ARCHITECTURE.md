# Pipeline de ingestão
```mermaid
flowchart TD

    %% =========================
    %% BOOK INGESTION PIPELINE
    %% =========================

    A["Book Upload<br/>Raw HTML chapters + assets<br/>R2: livro-inteligente-raw<br/>Folder name = slug"]

    %% WATCHER
    subgraph W1["1 - injection-watcher Worker (Cron)"]

        W1A["Cron Trigger<br/>Every 10 min"]
        W1B["Scan root folders<br/>R2 livro-inteligente-raw"]
        W1C["Check slug existence<br/>D1 injected_books"]

        W1D["Register status = QUEUED"]
        W1E["Enqueue folder_name<br/>Cloudflare Queue"]

        W1F["Skip already known slugs<br/>Idempotent"]

        W1A --> W1B
        W1B --> W1C

        W1C -->|New slug| W1D
        W1D --> W1E

        W1C -->|Already exists| W1F

    end

    %% PROCESSOR
    subgraph P1["2 - make-book-intelligent Worker (Queue Consumer)"]

        P0["Consume queue message<br/>folder_name"]

        %% 2A
        subgraph P2A["2a - Extract Book Structure"]

            P2A1["Read HTML files<br/>from source R2"]
            P2A2["Convert HTML to Markdown"]
            P2A3["Parse metadata<br/>title, authors, description,<br/>prev/next navigation"]
            P2A4["Classify files<br/>chapter, section,<br/>activities, annex, about"]
            P2A5["Build chapter graph<br/>in-memory metadata object"]
            P2A6["Write .md files<br/>to processed R2"]

            P2A1 --> P2A2
            P2A2 --> P2A3
            P2A3 --> P2A4
            P2A4 --> P2A5
            P2A5 --> P2A6

        end

        %% 2B
        subgraph P2B["2b - Enrich with AI"]

            P2B1["Read Markdown chapter"]
            P2B2["Workers AI<br/>llama-3.1-8b-instruct"]

            P2B3["Generate trivia questions"]
            P2B4["Generate boss trivia"]
            P2B5["Generate boss metadata"]

            P2B6["Inject enrichments<br/>into metadata object"]

            P2B7["Write checkpoint<br/>metadata.json snapshot"]

            P2B1 --> P2B2

            P2B2 --> P2B3
            P2B2 --> P2B4
            P2B2 --> P2B5

            P2B3 --> P2B6
            P2B4 --> P2B6
            P2B5 --> P2B6

            P2B6 --> P2B7

        end

        %% 2C
        subgraph P2C["2c - Persist Book Metadata"]

            P2C1["Write final metadata.json"]
            P2C2["Upsert D1 book_metadata row"]

            P2C1 --> P2C2

        end

        %% 2D
        subgraph P2D["2d - Generate Manifest"]

            P2D1["List source assets"]
            P2D2["Build ordered manifest"]
            P2D3["Include CSS URLs"]
            P2D4["Write manifest.json"]

            P2D1 --> P2D2
            P2D2 --> P2D3
            P2D3 --> P2D4

        end

        P0 --> P2A
        P2A --> P2B
        P2B --> P2C
        P2C --> P2D

    end

    %% FINALIZATION
    subgraph F1["3 - Status Finalisation"]

        F1A["Update injected_books"]

        F1B["Status = SUCCESS"]
        F1C["Status = FAILED<br/>on unrecovered error"]

        F1A --> F1B
        F1A --> F1C

    end

    %% ARTIFACTS
    subgraph ART["Generated Artifacts"]

        ART1["{slug}/*.md"]
        ART2["{slug}/metadata.json"]
        ART3["{slug}/manifest.json"]
        ART4["D1 book_metadata row"]
        ART5["D1 injected_books row"]

    end

    %% CONSUMERS
    subgraph CONS["Consumers"]

        C1["PWA + API"]
        C2["PWA Service Worker<br/>Offline Cache"]
        C3["Book Listing API"]
        C4["Watcher Deduplication"]

    end

    %% MAIN FLOW
    A --> W1
    W1E --> P0
    P2D --> F1A

    %% ARTIFACT LINKS
    P2A6 --> ART1
    P2B7 --> ART2
    P2C1 --> ART2
    P2D4 --> ART3
    P2C2 --> ART4
    F1A --> ART5

    %% CONSUMERS LINKS
    ART2 --> C1
    ART3 --> C2
    ART4 --> C3
    ART5 --> C4
```

# Estratégia de geração de dia zero, geração sob demanda e estruturação do runtime

```mermaid
flowchart TB

    %% =========================================================
    %% SOURCE STORAGE
    %% =========================================================
    subgraph R2["R2 Object Storage"]
        RAW["Book Folder<br/>slug/"]
        MANIFEST["manifest.json<br/>Flat asset list"]
        METADATA["metadata.json<br/>Book structure + AI data"]

        subgraph ASSETS["Book Assets"]
            HTML["Chapter HTML"]
            MD["AI Markdown"]
            STATIC["CSS / JS / Images"]
        end
    end

    RAW --> MANIFEST
    RAW --> METADATA
    RAW --> ASSETS

    %% =========================================================
    %% DOWNLOAD PIPELINE
    %% =========================================================
    subgraph DOWNLOAD["PWA Download Pipeline"]
        START["User Downloads Book"]

        LOAD_MANIFEST["loadManifestEntries()<br/>fetch(manifest.json)<br/>cache:no-store"]

        FALLBACK{"manifest.json<br/>exists?"}

        EXTRACT_MANIFEST["extractManifestAssetUrls()<br/>Resolve relative URLs"]

        FALLBACK_METADATA["Parse metadata.json<br/>Extract chapter.file_path<br/>+ markdown_path"]

        CONCURRENT["runWithConcurrency(6)<br/>Concurrent downloads"]

        CACHE_REMOTE["cacheRemoteAsset()<br/>fetch() + cache.put()"]

        TEMP_CACHE["Temporary Cache API Bucket<br/>book-store-{id}-dl"]

        PROMOTE["replaceCacheContents()<br/>Atomic promotion"]

        FINAL_CACHE["Final Cache API Bucket<br/>book-store-{id}"]

        CLEANUP["Delete staging bucket"]
    end

    START --> LOAD_MANIFEST
    LOAD_MANIFEST --> FALLBACK

    FALLBACK -->|Yes| EXTRACT_MANIFEST
    FALLBACK -->|404| FALLBACK_METADATA

    EXTRACT_MANIFEST --> CONCURRENT
    FALLBACK_METADATA --> CONCURRENT

    CONCURRENT --> CACHE_REMOTE
    CACHE_REMOTE --> TEMP_CACHE
    TEMP_CACHE --> PROMOTE
    PROMOTE --> FINAL_CACHE
    PROMOTE --> CLEANUP

    %% =========================================================
    %% METADATA STRUCTURE
    %% =========================================================
    subgraph METADATA_DETAILS["metadata.json Structure"]
        BOOK["Book Identity<br/>book_id, slug, title,<br/>authors, description"]

        PIPELINE["Pipeline Metadata<br/>created_at, updated_at,<br/>published_at"]

        CHAPTERS["chapters[]"]

        subgraph CHAPTER["Chapter Object"]
            STRUCTURE["Hierarchy<br/>id, order, parent_id"]

            PATHS["Paths<br/>file_path<br/>markdown_path"]

            NAV["Navigation<br/>previous_*<br/>next_*"]

            VIDEOS["videos[]"]

            BOSS["boss<br/>AI Boss Metadata"]

            ENRICH["enrichment[]<br/>trivia / boss_trivia"]
        end
    end

    METADATA --> BOOK
    METADATA --> PIPELINE
    METADATA --> CHAPTERS

    CHAPTERS --> CHAPTER

    %% =========================================================
    %% DEXIE DATABASE
    %% =========================================================
    subgraph DEXIE["Dexie.js Database<br/>livro-inteligente-pwa"]
        BOOKS["books<br/>id"]

        SNAPSHOT["metadataSnapshot<br/>Full metadata.json"]

        STATUS["downloadStatus<br/>idle → pending → completed"]

        SOURCE["downloadSource<br/>manifest / fallback"]

        READING["readingProgress<br/>bookId + chapterId"]

        GAME["gameProgress<br/>[bookId+challengeId]"]

        COINS["aiCoins<br/>Default: 5"]
    end

    METADATA --> SNAPSHOT
    SNAPSHOT --> BOOKS

    BOOKS --> STATUS
    BOOKS --> SOURCE

    %% =========================================================
    %% OFFLINE READING FLOW
    %% =========================================================
    subgraph READING_FLOW["Offline Reading Runtime"]
        OPEN_CACHE["caches.open()<br/>book-store-{id}"]

        MATCH["cache.match(chapterUrl)"]

        RENDER["Render Chapter Offline"]

        LOAD_META["Read metadataSnapshot<br/>from Dexie"]

        NAVIGATION["Chapter Navigation"]

        BOSSES["Boss Battles"]

        TRIVIA["Trivia / Enrichment"]
    end

    FINAL_CACHE --> OPEN_CACHE
    OPEN_CACHE --> MATCH
    MATCH --> RENDER

    SNAPSHOT --> LOAD_META

    LOAD_META --> NAVIGATION
    LOAD_META --> BOSSES
    LOAD_META --> TRIVIA

    %% =========================================================
    %% LOCAL AI ENRICHMENT
    %% =========================================================
    subgraph LOCAL_AI["Local AI Enrichment Flow"]
        GENERATE["AI Generates Trivia"]

        CLONE["structuredClone(metadataSnapshot)"]

        INSERT["Push enrichment[]<br/>generated_locally: true"]

        UPDATE["updateBookRecord()"]

        SAVE["Persist Updated Snapshot"]
    end

    GENERATE --> CLONE
    CLONE --> INSERT
    INSERT --> UPDATE
    UPDATE --> SAVE
    SAVE --> SNAPSHOT
```

# Segurança

O sistema deixa de lado algumas características estruturais de segurança em prol de facilidade de apresentação e de foco, cruzando tempo com complexidade, em entregar um livro que encanta. Existem dois pontos críticos de segurança que são conhecidos e que DEVEM ser atacados numa V2:
- É necessário criar uma estrutura de login e acesso dos usuários. Isso pode ser feito com uma modelagem dos dados de usuário / leitor somado à um fluxo de autenticação e autorização com JWT. Também é preciso proteger as rotas da API com acesso.
- É necessário bloquear o acesso público da máquina R2, e encapsular o livro em rotas protegidas. Para acesso à um livro, podemos utilizar a geração de links assinados, por exemplo. Porém, a estrutura de leitura e armazenamento pode não ficar mais tão trivial, e pode precisar de um retrabalho no PWA e no formato de acesso aos arquivos como um todo. Por conta dessa complexidade, preferi evitar trabalhar nisso agora, mas para uma próxima versão se faz extremamente necessário. 

# Trade-offs

Foram tomadas as seguintes decisões globais:
- Foco em subir toda a estrutura no Cloudflare. O principal trade-off aqui é para o fluxo de ingestão, que poderia ter sido rodado local, por exemplo. Mas eu decidi usar e complexar um pouco o fluxo também para aprender alguns itens de infraestrutura da cloudflare que ainda não tinha tido oportunidade de estudar. Porém, o fluxo ficou funcional e generalista. Para uma V2, usaria apenas o fluxo de Workflows diretamente disparado pelo watcher, ao invés de um CRON + Queue. 
- Foco na interatividade / encantamento do livro e no respeito ao requisito de funcionamento offline no day zero, focando menos em exibir conhecimento técnico e mais em entregar uma visão mista de alinhamento com a estratégia e decisões técnicas guiadas pelo prazo curto e apertado. É necessário em uma V2 priorizar a proteção dos arquivos do Livro e a estrutura de usuário para progeter com login o acesso mas também sincronizar o status em múltiplos dispositivos;
- Simplicidade estrutural da representação e interface de consumo dos livros;
- Visão de futuro para o pipeline de ingestão e para o consumo do que foi gerado no PWA, com foco na possibilidade continua de adição de novas maneiras de enriquecimento (métodos de enriquecimento no fluxo `make-book-intelligent`) mas também na flexibilidade de consumo desses enriquecimentos (criação de widgets flutuantes);
- Evitar otimização prematura em prol de ter um resultado mais rico no processo de enriquecimento do livro, o que implica em um custo de IA que pode ser otimizado no futuro; 
- Solução aberta, focada na faclididade de explorar e testar, com o conhecimento dos trade offs de funcionalidades e segurança;