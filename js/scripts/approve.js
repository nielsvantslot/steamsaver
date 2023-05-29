if (typeof init === 'undefined') {

  const init = function() {
    const styles = {
      ".steam_saver": {
        position: "fixed",
        bottom: "100px",
        left: "0",
        width: "200px",
        height: "100px",
        color: "#fff",
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(28, 190, 28, 0.5)",
        borderTopRightRadius: "10px",
        borderBottomRightRadius: "10px"
      }
    }

    const box = document.createElement("div");

    box.className = "steam_saver";
    Object.assign(box.style, styles['.steam_saver']);
    box.innerHTML = "This site is safe";
    document.body.appendChild(box);
  }
  init();
}
