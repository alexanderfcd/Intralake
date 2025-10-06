//todo: separate

(function () {
  const starButton = (objectId, isLiked) => {
    const btn = document.createElement("span");
    btn.className = "il-star-btn";
    const tipAdd = "Add to favorites";
    const tipRemove = "Remove from favorites";

    btn.__isLiked = isLiked;
    btn.__working = false;
    btn.setAttribute("wtip", tipAdd);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (btn.__working) {
        return;
      }
      btn.__working = true;
      if (btn.__isLiked) {
      }
    });

    return btn;
  };

  il.component = {
    starButton,
  };
})();
