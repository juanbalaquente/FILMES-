document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://faaajfbntirczxdukyxa.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYWFqZmJudGlyY3p4ZHVreXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMjA1MTYsImV4cCI6MjA2NTU5NjUxNn0.bBOH_R_m5VT-1uTjcAjWg0ZkrG9ubsdh-JXijqD7wRw";
  const TMDB_API_KEY = "4f2329b4cc7f2305c627bca526928b82";

  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const formBusca = document.getElementById("form-busca");
  const inputBusca = document.getElementById("input-busca");
  const searchResultsContainer = document.getElementById("search-results");
  const addContainer = document.getElementById("add-container");
  const formFilme = document.getElementById("form-filme");
  const inputTitulo = document.getElementById("input-titulo");
  const inputRating = document.getElementById("input-rating");
  const stars = document.querySelectorAll(".rating-input .star");
  const listaFilmes = document.getElementById("lista-filmes");

  let selectedMovieData = null;

  async function fetchFilmes() {
    const { data, error } = await supabaseClient
      .from("filmes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar filmes:", error);
      return;
    }
    listaFilmes.innerHTML = "";
    data.forEach((filme) => renderizarFilme(filme));
  }

  async function adicionarFilmeNaLista(event) {
    event.preventDefault();
    const novoFilme = {
      titulo: selectedMovieData.title,
      poster_url: selectedMovieData.posterUrl,
      rating: inputRating.value,
      detalhes: document.getElementById("input-detalhes").value.trim(),
    };

    const { error } = await supabaseClient.from("filmes").insert([novoFilme]);

    if (error) {
      console.error("Erro ao adicionar filme:", error);
    } else {
      fetchFilmes();
      formFilme.reset();
      addContainer.style.display = "none";
      searchResultsContainer.innerHTML = "";
      formBusca.reset();
      inputRating.value = "0";
      stars.forEach((s) => (s.innerHTML = "☆"));
    }
  }

  async function removerFilme(filmeId) {
    const { error } = await supabaseClient
      .from("filmes")
      .delete()
      .eq("id", filmeId);

    if (error) {
      console.error("Erro ao remover filme:", error);
    } else {
      fetchFilmes();
    }
  }

  async function salvarEdicao(filmeId, novaNota, novosDetalhes) {
    const { error } = await supabaseClient
      .from("filmes")
      .update({ rating: novaNota, detalhes: novosDetalhes })
      .eq("id", filmeId);

    if (error) {
      console.error("Erro ao salvar edição:", error);
    } else {
      fetchFilmes();
    }
  }

  function renderizarFilme(filme) {
    const item = document.createElement("li");
    item.className = "filme-item";
    const posterImg = document.createElement("img");
    posterImg.className = "filme-poster";
    posterImg.src =
      filme.poster_url ||
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
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "actions-container";
    const btnRemover = document.createElement("button");
    btnRemover.className = "btn-remover";
    btnRemover.textContent = "Remover";
    btnRemover.addEventListener("click", () => removerFilme(filme.id));
    const btnEditar = document.createElement("button");
    btnEditar.className = "btn-editar";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => toggleEditView(item, filme));
    actionsContainer.appendChild(btnEditar);
    actionsContainer.appendChild(btnRemover);
    infoDiv.appendChild(ratingDiv);
    infoDiv.appendChild(tituloP);
    infoDiv.appendChild(detalhesP);
    item.appendChild(posterImg);
    item.appendChild(infoDiv);
    item.appendChild(actionsContainer);
    listaFilmes.appendChild(item);
  }

  function toggleEditView(item, filme) {
    item.classList.add("edit-mode");
    const infoDiv = item.querySelector(".filme-info");
    const actionsContainer = item.querySelector(".actions-container");
    infoDiv.innerHTML = "";
    actionsContainer.innerHTML = "";
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
        ratingInputDiv
          .querySelectorAll(".star")
          .forEach(
            (s) => (s.innerHTML = s.dataset.value <= newRating ? "★" : "☆")
          );
      });
      ratingInputDiv.appendChild(star);
    }
    const detalhesTextarea = document.createElement("textarea");
    detalhesTextarea.className = "edit-textarea";
    detalhesTextarea.rows = 4;
    detalhesTextarea.value = filme.detalhes;
    infoDiv.appendChild(ratingInputDiv);
    infoDiv.appendChild(detalhesTextarea);
    const btnSalvar = document.createElement("button");
    btnSalvar.className = "btn-salvar";
    btnSalvar.textContent = "Salvar";
    btnSalvar.addEventListener("click", () =>
      salvarEdicao(filme.id, newRating, detalhesTextarea.value)
    );
    const btnCancelar = document.createElement("button");
    btnCancelar.className = "btn-cancelar";
    btnCancelar.textContent = "Cancelar";
    btnCancelar.addEventListener("click", () => fetchFilmes());
    actionsContainer.appendChild(btnSalvar);
    actionsContainer.appendChild(btnCancelar);
  }

  async function buscarFilmesNaAPI(query) {
    searchResultsContainer.innerHTML = "<p>Buscando...</p>";
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        query
      )}&language=pt-BR`
    );
    const data = await response.json();
    exibirResultadosDaBusca(data.results);
  }

  function exibirResultadosDaBusca(filmes) {
    searchResultsContainer.innerHTML = "";
    filmes.forEach((filme) => {
      const resultItem = document.createElement("div");
      resultItem.className = "result-item";
      const posterUrl = filme.poster_path
        ? `https://image.tmdb.org/t/p/w200${filme.poster_path}`
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
        addContainer.style.display = "block";
      });
      searchResultsContainer.appendChild(resultItem);
    });
  }

  // --- EVENT LISTENERS ---
  formBusca.addEventListener("submit", (e) => {
    e.preventDefault();
    buscarFilmesNaAPI(inputBusca.value.trim());
  });
  formFilme.addEventListener("submit", adicionarFilmeNaLista);
  stars.forEach((star) => {
    star.addEventListener("mouseover", (e) => {
      const val = e.target.dataset.value;
      stars.forEach((s) => (s.innerHTML = s.dataset.value <= val ? "★" : "☆"));
    });
    star.addEventListener("mouseout", () => {
      const val = inputRating.value;
      stars.forEach((s) => (s.innerHTML = s.dataset.value <= val ? "★" : "☆"));
    });
    star.addEventListener("click", (e) => {
      inputRating.value = e.target.dataset.value;
    });
  });

  fetchFilmes();
});
