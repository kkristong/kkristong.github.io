const girlButton = document.getElementById("girlButton");
const photo1 = document.querySelector(".photo-1");
const photo2 = document.querySelector(".photo-2");
const photo3 = document.querySelector(".photo-3");
const instructionText = document.getElementById("instructionText");
const secretText = document.getElementById("secretText");


girlButton.addEventListener("click", function () {
  girlButton.style.display = "none";
  photo1.style.display = "block";

  setTimeout(function () {
    instructionText.textContent = "keep clicking";
  }, 1600);

  setTimeout(function () {
    photo1.style.transform = "translate(-160%, -50%)";
  }, 400);
});


photo1.addEventListener("click", function () {
  photo2.style.display = "block";
  setTimeout(function () {
    instructionText.textContent = "ONE MORE!";
  }, 400);
});


photo2.addEventListener("click", function () {
  photo3.style.display = "block";
  photo3.style.transform = "translate(60%, -50%)";

  setTimeout(function () {
    instructionText.textContent = "GOOD JOB!!:P";
  }, 400);

  setTimeout(function () {
    instructionText.textContent = "THE SECRET OF HER(MY) BEAUTY IS...";
    secretText.style.display = "block";
  }, 1600);
});
