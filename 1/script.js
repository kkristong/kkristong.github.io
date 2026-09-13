const lightbox = document.getElementById("lightbox");
const expandedImage = lightbox.querySelector("img");
document.querySelectorAll("figure img").forEach((image) => image.addEventListener("click", () => {
  expandedImage.src = image.src; expandedImage.alt = image.alt; lightbox.showModal();
}));
lightbox.querySelector("button").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => { if (event.target === lightbox) lightbox.close(); });
