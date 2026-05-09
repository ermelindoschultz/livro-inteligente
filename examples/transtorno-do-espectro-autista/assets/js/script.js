
var botoesResposta = document.querySelectorAll(".botao-resposta");


for (var i = 0; i < botoesResposta.length; i++) {

  botoesResposta[i].addEventListener("click", function() {

    var resposta = this.nextElementSibling;


    if (resposta.style.display === "none") {

      resposta.style.display = "block";
      this.innerHTML = "Ocultar resposta";
    } else {

      resposta.style.display = "none";
      this.innerHTML = "Ver resposta";
    }
  });
}

function copyCode(event) {
  // Encontra o elemento de código dentro da caixa de código atual
  var codeElement = event.target.parentNode.nextElementSibling.querySelector('code');

  // Cria um elemento de textarea temporário
  var tempTextarea = document.createElement('textarea');
  tempTextarea.value = codeElement.innerText;

  // Adiciona o elemento de textarea temporário ao DOM
  document.body.appendChild(tempTextarea);

  // Seleciona o conteúdo do textarea
  tempTextarea.select();

  // Executa o comando de cópia
  document.execCommand('copy');

  // Remove o textarea temporário do DOM
  document.body.removeChild(tempTextarea);
}