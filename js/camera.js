async function tomarFoto() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.capture = "environment"; // cámara trasera

  return new Promise(resolve => {
    input.onchange = () => resolve(input.files[0]);
    input.click();
  });
}
