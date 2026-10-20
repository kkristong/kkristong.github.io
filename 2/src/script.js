const dialog = document.querySelector("#lightbox");
const dialogImage = dialog.querySelector("img");
const closeButton = dialog.querySelector("button");

document.querySelectorAll("figure img").forEach((image) => {
  image.addEventListener("click", () => {
    dialogImage.src = image.src;
    dialogImage.alt = image.alt;
    dialog.showModal();
  });
});

closeButton.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
