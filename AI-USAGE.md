# Visão Geral

Este projeto foi construído mixando vibe code com desenvolvimento assistido. A IA foi usada em 3 domínios:

- *Entendimento de contexto e pesquisa*: Foi utilizado o Google Gemini para analisar o documento, reforçar os entendimentos diante dos requisitos, e elaborar possibilidades de pesquisa. Por exemplo, eu nunca havia trabalhado com PWA diretamente, apenas pesquisado alguns anos atrás alguns conceitos e ferramentas. Então, aprofundei com o Gemini sobre conceitos e possibilidades, tentando manter as estruturas em tecnologias que tenho conforto, e somando a leitura técnica exploratórias de alguns blogs para orientar as decisões (usar Dexie.js, usar uma abordagemde Shadow DOM, etc).
- *Desenvolvimento assistindo + Vibe code*: O projeto foi conduzido iniciando sempre da estrutura mais básica para a mais complexa. O projeto foi "fatiado" de forma a começar estruturando os fluxos principais (estrutura lógica do watcher, PWA funcional básico, estrutura básica para alimentação do PWA, etc) e depois as features foram evoluindo para atender minimamente os requisitos de projeto focando numa entrega mais criativa / encantadora (ex: primeiro criar a estrutura de metadados, depois adicionar um fluxo para gerar um BOSS, desafio, etc). Porém, a API, por ser o elemento mais simplificado e o que eu dei menos atenção, foi basicamente criada com Vibe Coding, com intervenção mínima, apenas o prompt inicial + pequenas adições + revisão e ajustes finais. 
- *Revisão e refatoração de prompts assistido por IA*: O processo de tornar o livro inteligente usa muitos prompts. Fiz um processo de iniciar um prompt simples, e ir incrementando e reestruturando usando o ChatGPT. Assim, os prompts que alimentam os modelos do fluxo contemplam mais edge cases e restrições, além de uma descrição. 

O desenvolvimento foi integralmente realizado com Github Copilot + Vs Code devido ao conforto de uso versus o prazo de entrega. Trabalhei no fluxo que já utilizava no dia-a-dia, com uma abordagem simples mas poderosa em três etapas que é totalmente integrado com os modos de agente do Github Copilot:
- *Análise*: Utilizar um modelo com alta capacidade de reasoning para analisar problemas ou contextos mais longos com o Agent mode setado como `Ask`. Fazer um fluxo iterativo de perguntas até chegar numa conclusão e partir pra próxima etapa. Anteriormente, utilizava os modelos da Opus para tal tarefa. Porém, com as restrições recentes do Copilot, utilizei o Sonnet. Para este teste, eu utilizei o fluxo muito pouco, uma vez que para criar features do zero não necessáriamente precisa ficar pedindo para analisar. Mas teve um caso relevante: a lista de livros estava sendo carregada no banco do navegador, porém, ao ficar offline, a lista não estava sendo exibida. Fiz então uma análise nestes termos para: entender o fluxo de leitura do livro da lista + pedir para analisar possiveis problemas. Com isso, tive maior clareza do problema e pude criar um plano de ação para resolvê-lo.
- *Plano*: Antes de executar qualquer tarefa mais complexa, eu utilizei o modo `Plan` para planejar e revisar as tarefas. Descrevi detalhadamente o que esperava para cada funcionalidade implementada. O modelo Sonnet gerava um plano detalhado, eu respondia as perguntas, revisava e pedia ajustes. Então passava para a implementação.
- *Implementação*: Com o plano em mãos, realizei a implementação no modo `Agent`. Aqui, tem um detalhe importante: ao invés de usar o mesmo modelo, eu utilizei majoritáriamente o modelo GPT 5.4. Fiz por duas razões: primeiro, pelo enrequicimento e variabilidade de contexto, uma vez que os modelos podem ter dados e contexto de treinamento diversos, aumentando a amplitude das soluções, e segundo porquê recentemente vi alguns benchmarks o qual o GPT 5.4 desempenhava melhor nas tarefas de código. Quando comecei a fazer essa abordagem cruzada de modelos, comecei a senti um código melhor gerado, mas é mais uma sensação subjetiva.

Em algumas funcionalidades menos estruturais, para agilizar, eu pulei essas etapas e apenas utilizei o modo agente diretamente.

# Decisões de delegação 

Eu deleguei quase que todo o código escrito à IA, sempre revisando e fazendo pequenas modificações. 

Alguns processos eu deleguei as decisões para a IA e outros eu assumi as decisões as passando via PROMPT.

Alguns processos que deleguei as decisões para IA:
- *Estrutura e implementação da API*: Fui menos rigido na implementação da API, uma vez que foi um dos elementos que decidi simplificar no processo. Apenas descrevi as funcionalidades necessárias, a estrutura das tabelas do banco, e pedi para que respeitasse os padrões REST e que se inspirasse minimamente na estrutura de organização do Nest (controller -> serviço -> repositório) para ter o minimo de controle da evolução dessa API no futuro. 

Prompt utilizado para realizar o planning:

```markdown
You are a senior Javascript backend developer specialized in build Hono apis at cloudflare workers.  You are responsible to plan the api for the PWA of livro inteligente system. The api lives in "livro-inteligente-api" folder.

The system has a database named "livro-inteligente" at D1 service. The database has two main initial structures:

injected_books table: a table with id, folder_name, status, created_at, and updated_at. 

book_metadata: a table that manages the book metadata of already injected books. It should have important metadata for books (you can propose to me). It is important to cite, the book will be stored into R2 folder so it is important to be able to access it from PWA. Ask me any question and review with me the created structure.

The API should follow best REST practices, and should implement two initial features:

- List available books
- Get book metadata by id

Organize the code separating files. Mimic the nest JS controller + service + repository pattern. Controllers should expose routes, services should implements business logic, and repository should be the data access abstract interface to the services.

Create necessary migrations files. The API will be responsible to define and manage the database schema. 
```

Apenas com esse prompt praticamente todo o código foi corretamente gerado de forma funcional. Precisei pedir apenas para gerar um arquivo `API-DOC.md` para apoiar o processo de uso dessa API pelo PWA. 

- *Implementação V0 do PWA*: Como eu nunca tinha implementado um PWA, eu não quis realizar o processo na mão. Pedi para que criasse uma estrutura com React + Vite + Plugin do vite para PWA. Também pedi para estruturar os dados locais com Cache API + Dexie.js. Ele fez uma primeira versão semi-funcional, sem estrutura minima. Intervi para ter o minimo de arquitetura, pelo menos representado nas pastas. 


- *Implementação do Injection Watcher*: Ao contrário do PWA, eu já havia trabalho com algo semelhante ao Injection Watcher. Ao mesmo tempo, sabia que era uma solução bem conhecida, e bem fácil de interpretar e implementar. Como sua tarefa é simples (ler de um bucket e colocar na fila o processo enriquecimento do livro), deleguei completamente o processo descrevendo com detalhes as estruturas e o que precisava - o que acelerou demais o processo.

Sobre os processos que eu defini e tive maior profundidade de atuação, vou descrever em maior detalhe o seguinte:
- *Processo de geração de metadados e enriquecimento*: O processo de enriquecimento é o mais importante, na minha leitura, desse desafio. Aqui então é onde eu mais apliquei trabalho ou manual, ou de orientação arquitetural para a IA. Aqui, também, é onde eu melhor dividi o processo. Eu estava, preocupado, primeiro, em conseguir consumir a fila e conectar todos os pontos da infraestrutura. Eu também queria fazer um processo baseado em *etapas expansíveis* onde fosse possível adicionar mais etapas de enriquecimento (ex: inserção dos dados em um banco de dados em vetor, adicionar novos processos de enriquecimento, etc). Então iniciei com o seguinte prompt detalhado (enriquecido com o chatgpt) para análise antes de criar um plano de ingestão dos livros:

```markdown
# Role
You are a **Principal AI Data Engineer** specializing in RAG (Retrieval-Augmented Generation) and automated ingestion pipelines for educational content.

# Context
We are building an "Intelligent Book" platform for students. We have an immutable library of 750 textbooks. Each book is a folder containing multiple `.html` files (chapters) and `assets/` (CSS, JS, Images). Our goal is to transform these static files into a structured, AI-enhanced PWA that works 100% offline.

# Input Task
Analyze the provided sample book "transtorno-do-espectro-autista" (specifically the HTML structure and file organization). Your goal is to provide a technical blueprint for a **Node.js Ingestion Script** that will run in a Cloudflare environment.

# Required Deliverables

### 1. Structural Pattern Analysis
* Identify the exact CSS selectors or HTML patterns to programmatically extract: **Chapter Titles**, **Sub-headlines**, **Main Body Text**, and **Image Captions**.
* Define how to distinguish "Content" from "Boilerplate" (navigation menus, footers, or publisher metadata) that should be discarded to save tokens.

### 2. HTML to Markdown Transformation Logic
* Propose rules for handling complex elements (Call-out boxes, Tables, Bibliographies) so they remain semantically meaningful for an LLM.
* Provide instructions on stripping unnecessary attributes (classes, inline styles) while preserving structural hierarchy (H1, H2, H3).

### 3. Navigation & Metadata Schema (`metadata.json`)
* Design a JSON schema that describes the book's architecture. It must include:
    * `book_id` and `slug`.
    * An ordered `chapters` array with `file_path`, `title`, and `id`.
    * A `navigation_tree` for the PWA sidebar.

### 4. Vectorization & RAG Strategy
* Recommend an optimal **Chunking Strategy** (e.g., recursive character splitting vs. section-based splitting) considering these are educational textbooks.
* Define what metadata should be attached to each vector (e.g., `chapter_id`, `context_summary`) to improve retrieval accuracy during "On-demand" AI interactions.

### 5. Pipeline Logic
* Outline the logical steps for a script to: 
    1. Scan the `raw/` folder in Cloudflare R2.
    2. Convert HTML to Markdown (Cleaning phase).
    3. Trigger LLM enrichment (for "Day Zero" summaries/quizzes).
    4. Save final artifacts to the `processed/` folder.

# Strict Constraint
**The source files are IMMUTABLE.** Do not suggest editing the original HTML files. All "intelligence" must be stored in the external `metadata.json` or injected dynamically at runtime via the PWA (using Shadow DOM or Direct Injection).
```

Eu pensei inicialmente em vetorizar os dados, mas cheguei a conclusão que o chat seria uma feature não tão criativa, apesar de demonstrar o conhecimento em RAG no geral. Com o plano em mãos, refleti sobre, e dei uma polida e simplificada na primeira versão. Então, pedi para a AI criar um plano com o seguinte prompt:

```markdown
Perfect, now we understanding the data,  let's plan the ingestion.

The make book intelligence will consume from livro-inteligente-injection-queue. It is produced at "injection-watcher", you can check how it is beign produced there.

First, lets create metadata json file, that describes the book, and create an `ai` folder, that will receive chapters in MD.

The pipeline will be divided by steps. The first step, that I described before, should extract metadata from html and produces MDs for AI enrichment in next steps. Only produce the first step.

Organize the script into steps executions. It should be allowed to be called when worker consumes the queue, but I also can be able to call in a separated script (calling direct with node locally, for example), then make the entire process well defined, organized, separated, and with a level of abstraction. 

When running locally, please setup an `out` folder, that is with .gitkeep but with content on gitignore.
```

Minha preocupação, por primeiro, foi criar o arquivo `metadata.json` que é o coração do processo de funcionamento na abordagem `day zero`. Outro ponto importante é que coloquei o livro na pasta `examples` e isso foi fundamental para alimentar o processo entendendo nomes de arquivos, estruturas do HTML, etc.

O primeiro plano pareceu ok, e pedi para que fosse implementado. Mas duas coisas não deram certo: o script local não funciona, devido a eu usar uma versão de linux mais antiga. Então, abortei qualquer possibilidade de rodar local ali, focando mais em utilizar a estrutura da Cloudflare (o qual queria aprofundar alguns tópicos). O segundo ponto é que a IA teve bastante dificuldade de entender o processo de ordenamento dos capítulos, e precisei intervir diretamente, tanto adicionando alguns entendimentos, mas principalmente escrevendo o script de ordenação dos capítulos de forma correta. Após essas modificações fui para o plano de enriquecimento.

Uma vez que a estrutura de metadados principais do livro estava funcional, tracei um plano inicial mais simples de enriquecimento. Ainda não tinha tido uma ideia muito boa, então apenas orientei a estrutura de enriquecimento (campo `enrichment` no metadata) para fazer 3 processos simples: uma trivia, um resumo para teste e o que o aluno ia ler. Por mais que 2 desses tenham sido descartados, foi fundamental para alimentar corretamente o PWA e desenhar a estrutura de widgets de enriquecimento que foi utilizado na versão final. 

# Caso de rejeição / correção de IA

## Uso de typescript ao invés de javascript

O primeiro ponto, simples, mas que poderia ter trazido pontos críticos, é que, ao iniciar a implementação do `Reader`, mesmo com o PWA já em estrutura de Javascript, a IA começou a produzir código em TS (que não está funcional devido a limitação da minha máquina citada anteriormente). Precisei interromper a geração e instruir a usar só JS.

## Relayout para pixel art sem boas práticas mínimas de design

No relayout para pixel art, que foi feito com vibe coding, a IA produziu um layout alinhado com o que desejava, mas com a fonte muito peque, quase impossível de ler e um contraste de texto com backgrund, na página de Leitura, que também dificultava a leitura. Precisei especificar, inclusive com prints, para que seguisse boas práticas nessas partes.

## IA teve muita dificuldade de entender o processo de ordenação dos capítulos

A IA gerou um processo de ordenação dos capítulos incorretos pelo menos umas 3 vezes, mesmo eu tentando instruir e explicar a regra via prompt. Por primeiro, ela defini que o próximo capítulo seria `1.6` para todos. Depois, ela não conseguia seguir uma ordenação trivial de `1 -> 1.1 -> 1.2`. Precisei intervir codificando inteiramente a ordenação. 