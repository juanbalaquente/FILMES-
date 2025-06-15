document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÃO DA API ---
  const API_KEY = "4f2329b4cc7f2305c627bca526928b82"; // Lembre-se de manter sua chave aqui
  const API_BASE_URL = "https://api.themoviedb.org/3";
  const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w200";

  // --- SELEÇÃO DOS ELEMENTOS ---
  const formBusca = document.getElementById("form-busca");
  const inputBusca = document.getElementById("input-busca");
  const searchResultsContainer = document.getElementById("search-results");
  const addContainer = document.getElementById("add-container");
  const formFilme = document.getElementById("form-filme");
  const inputTitulo = document.getElementById("input-titulo");
  const inputPoster = document.getElementById("input-poster");
  const inputRating = document.getElementById("input-rating");
  const stars = document.querySelectorAll(".rating-input .star");
  const listaFilmes = document.getElementById("lista-filmes");

  let selectedMovieData = null;

  // --- FUNÇÕES DA API (sem alterações) ---
  const buscarFilmesNaAPI = async (query) => {
    searchResultsContainer.innerHTML = "<p>Buscando...</p>";
    try {
      const response = await fetch(
        `${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
          query
        )}&language=pt-BR`
      );
      if (!response.ok) throw new Error("Falha na busca da API.");
      const data = await response.json();
      exibirResultadosDaBusca(data.results);
    } catch (error) {
      searchResultsContainer.innerHTML = `<p>${error.message}</p>`;
    }
  };

  const exibirResultadosDaBusca = (filmes) => {
    searchResultsContainer.innerHTML = "";
    if (filmes.length === 0) {
      searchResultsContainer.innerHTML = "<p>Nenhum filme encontrado.</p>";
      return;
    }
    filmes.forEach((filme) => {
      const resultItem = document.createElement("div");
      resultItem.className = "result-item";
      const posterUrl = filme.poster_path
        ? `${IMAGE_BASE_URL}${filme.poster_path}`
        : "https://via.placeholder.com/50x75.png?text=N/A";
      const releaseYear = filme.release_date
        ? filme.release_date.split("-")[0]
        : "Ano desconhecido";
      resultItem.innerHTML = `<img src="${posterUrl}" alt="Pôster de ${filme.title}"><div class="result-info"><p class="result-title">${filme.title}</p><p class="result-year">${releaseYear}</p></div>`;
      resultItem.addEventListener("click", () => {
        document
          .querySelectorAll(".result-item.selected")
          .forEach((el) => el.classList.remove("selected"));
        resultItem.classList.add("selected");
        selectedMovieData = {
          title: filme.title,
          posterUrl: posterUrl,
          year: releaseYear,
        };
        inputTitulo.value = `${filme.title} (${releaseYear})`;
        inputPoster.value = posterUrl;
        addContainer.style.display = "block";
      });
      searchResultsContainer.appendChild(resultItem);
    });
  };

  // --- LÓGICA DA LISTA PESSOAL (Com alterações) ---
  const getFilmesSalvos = () =>
    JSON.parse(localStorage.getItem("meusFilmes")) || [];
  const salvarFilmes = (filmes) =>
    localStorage.setItem("meusFilmes", JSON.stringify(filmes));

  const renderizarFilme = (filme, index) => {
    const item = document.createElement("li");
    item.className = "filme-item";
    item.dataset.index = index;

    const posterImg = document.createElement("img");
    posterImg.className = "filme-poster";
    posterImg.src =
      filme.posterUrl ||
      "https://via.placeholder.com/100x150.png?text=Sem+Pôster";
    posterImg.onerror = function () {
      this.src = "https://via.placeholder.com/100x150.png?text=Erro";
    };

    const infoDiv = document.createElement("div");
    infoDiv.className = "filme-info";

    const ratingDiv = document.createElement("div");
    ratingDiv.className = "filme-rating";
    let ratingStars = "";
    for (let i = 1; i <= 5; i++) ratingStars += i <= filme.rating ? "★" : "☆";
    ratingDiv.textContent = ratingStars;

    const tituloP = document.createElement("p");
    tituloP.className = "filme-titulo";
    tituloP.textContent = filme.titulo;

    const detalhesP = document.createElement("p");
    detalhesP.className = "filme-detalhes";
    detalhesP.textContent = filme.detalhes;

    // --- Container para os botões de ação ---
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "actions-container";

    const btnRemover = document.createElement("button");
    btnRemover.className = "btn-remover";
    btnRemover.textContent = "Remover";
    btnRemover.addEventListener("click", () => removerFilme(index));

    // --- NOVO BOTÃO DE EDITAR ---
    const btnEditar = document.createElement("button");
    btnEditar.className = "btn-editar";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => toggleEditView(item, index));

    actionsContainer.appendChild(btnEditar); // Adiciona Editar
    actionsContainer.appendChild(btnRemover); // Adiciona Remover

    infoDiv.appendChild(ratingDiv);
    infoDiv.appendChild(tituloP);
    infoDiv.appendChild(detalhesP);

    item.appendChild(posterImg);
    item.appendChild(infoDiv);
    item.appendChild(actionsContainer); // Adiciona o container de ações

    listaFilmes.appendChild(item);
  };

  // --- NOVA FUNÇÃO PARA ATIVAR O MODO DE EDIÇÃO ---
  const toggleEditView = (item, index) => {
    const filmes = getFilmesSalvos();
    const filme = filmes[index];

    item.classList.add("edit-mode"); // Adiciona classe para destacar

    const infoDiv = item.querySelector(".filme-info");
    const actionsContainer = item.querySelector(".actions-container");

    // Guarda o conteúdo original para o caso de cancelar
    const originalContent = infoDiv.innerHTML;
    const originalActions = actionsContainer.innerHTML;

    // Limpa o conteúdo atual para substituir por inputs
    infoDiv.innerHTML = "";
    actionsContainer.innerHTML = "";

    // Cria input para a nota (estrelas)
    let newRating = filme.rating;
    const ratingInputDiv = document.createElement("div");
    ratingInputDiv.className = "rating-input";
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.dataset.value = i;
      star.innerHTML = i <= newRating ? "★" : "☆";
      star.addEventListener("click", () => {
        newRating = i;
        // Atualiza a aparência de todas as estrelas no modo de edição
        ratingInputDiv.querySelectorAll(".star").forEach((s) => {
          s.innerHTML = s.dataset.value <= newRating ? "★" : "☆";
        });
      });
      ratingInputDiv.appendChild(star);
    }

    // Cria textarea para os detalhes/comentários
    const detalhesTextarea = document.createElement("textarea");
    detalhesTextarea.className = "edit-textarea";
    detalhesTextarea.rows = 4;
    detalhesTextarea.value = filme.detalhes;

    infoDiv.appendChild(ratingInputDiv);
    infoDiv.appendChild(detalhesTextarea);

    // Cria botão Salvar
    const btnSalvar = document.createElement("button");
    btnSalvar.className = "btn-salvar";
    btnSalvar.textContent = "Salvar";
    btnSalvar.addEventListener("click", () => {
      filme.rating = newRating;
      filme.detalhes = detalhesTextarea.value;
      filmes[index] = filme; // Atualiza o filme no array
      salvarFilmes(filmes);
      renderizarTodosOsFilmes(); // Redesenha a lista inteira com os dados atualizados
    });

    // Cria botão Cancelar
    const btnCancelar = document.createElement("button");
    btnCancelar.className = "btn-cancelar";
    btnCancelar.textContent = "Cancelar";
    btnCancelar.addEventListener("click", () => {
      // A forma mais simples de cancelar é redesenhar tudo
      renderizarTodosOsFilmes();
    });

    actionsContainer.appendChild(btnSalvar);
    actionsContainer.appendChild(btnCancelar);
  };

  const renderizarTodosOsFilmes = () => {
    listaFilmes.innerHTML = "";
    getFilmesSalvos().forEach((filme, index) => renderizarFilme(filme, index));
  };

  const adicionarFilmeNaLista = (event) => {
    event.preventDefault();
    const novoFilme = {
      titulo: selectedMovieData.title,
      posterUrl: selectedMovieData.posterUrl,
      rating: inputRating.value,
      detalhes: document.getElementById("input-detalhes").value.trim(),
    };
    const filmes = getFilmesSalvos();
    filmes.push(novoFilme);
    salvarFilmes(filmes);
    renderizarTodosOsFilmes();
    formFilme.reset();
    addContainer.style.display = "none";
    searchResultsContainer.innerHTML = "";
    formBusca.reset();
    inputRating.value = "0";
    stars.forEach((s) => (s.innerHTML = "☆"));
  };

  const removerFilme = (indexParaRemover) => {
    const filmes = getFilmesSalvos().filter(
      (_, index) => index !== indexParaRemover
    );
    salvarFilmes(filmes);
    renderizarTodosOsFilmes();
  };

  // --- EVENT LISTENERS (sem alterações) ---
  formBusca.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = inputBusca.value.trim();
    if (query) buscarFilmesNaAPI(query);
  });

  formFilme.addEventListener("submit", adicionarFilmeNaLista);

  stars.forEach((star) => {
    star.addEventListener("mouseover", (e) => {
      const ratingValue = e.target.dataset.value;
      stars.forEach(
        (s) => (s.innerHTML = s.dataset.value <= ratingValue ? "★" : "☆")
      );
    });
    star.addEventListener("mouseout", () => {
      const currentRating = inputRating.value;
      stars.forEach(
        (s) => (s.innerHTML = s.dataset.value <= currentRating ? "★" : "☆")
      );
    });
    star.addEventListener("click", (e) => {
      inputRating.value = e.target.dataset.value;
    });
  });

  // --- INICIALIZAÇÃO ---
  renderizarTodosOsFilmes();
});
