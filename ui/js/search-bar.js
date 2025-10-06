class Search {
  constructor() {
    const scope = this;
    scope.render();
    setTimeout(function () {
      scope.makeSearch();
    }, 10);
  }

  makeSearch() {
    const form = this.root.querySelector("form.header-search");
    const searchField = form.querySelector('[name="search"]');
    searchField.onfocus = function () {
      form.classList.add("focused");
    };
    searchField.onblur = function () {
      form.classList.remove("focused");
    };
    form.onsubmit = function (e) {
      e.preventDefault();
      window.doSearch(form);
    };
    form.querySelector(".hs-dropdown-button").onclick = function () {
      form.classList.toggle("advanced-active");
    };
    document.body.onmousedown = function (e) {
      if (
        form.classList.contains("advanced-active") &&
        !form.contains(e.target)
      ) {
        form.classList.remove("advanced-active");
      }
    };
    document.body.ontouchstart = function (e) {
      if (
        form.classList.contains("advanced-active") &&
        !form.contains(e.target)
      ) {
        form.classList.remove("advanced-active");
      }
    };
    return this;
  }

  render() {
    const scope = this;
    this.root = w7.el({
      className: "header-search-box",
    });

    const html = `<div >
                <form class="header-search" autoComplete="off">
                    <div class="field-holder field-component basic-search">
                        <button type="submit" class="hs-submit"><span class="material-icons">search</span></button>
                        <input type="search" name="search" placeholder="Search"  />
                    </div>
                    <span class="hs-dropdown-button" wtip="Advanced search"></span>
                    <div class="hs-advanced">
                        <div class="field-holder">
                            <label>Type</label>
                            <select name="type">
                                <option value="" defaultValue>Any</option>
                                <option value="folder">Folders</option>
                                <option value="file">Files</option>
                                <option value="image"> - Images</option>
                                <option value="document"> - Documents</option>
                                <option value="media"> - Media</option>
                            </select>
                        </div>
                        <div class="field-holder">
                            <label>Tags</label>
                            <input type="text" name="tags" placeholder="tag1, tag2" />
                        </div>
                        <div class="field-holder">
                            <label>File Size</label>
                        </div>
                        <div class="field-holder field-component field-comp-pad" style="padding:0">
                            <select name="size1"  style="width:133px" >
                                <option defaultValue value="gt">Greater than</option>
                                <option value="lt">Less than</option>
                            </select>
                            <input type="text" name="size2" placeholder="0"  style="width:70px"  />
                            <select name="size3"  style="width:70px" >
                                <option value="mb">MB</option>
                                <option value="kb">KB</option>
                                <option value="b" defaultValue>bytes</option>
                            </select>
                        </div>
                        <div class="field-holder">
                            <label>Modified</label>
                            <select name="modified">
                                <option value="" defaultValue>Any</option>
                                <option value="1">Past hour</option>
                                <option value="2">Past day</option>
                                <option value="3">Past week</option>
                                <option value="4">Past month</option>
                                <option value="5">Past year</option>
                            </select>
                        </div>
                        <div class="field-holder">
                            <button type="submit" class="wui-btn wui-btn-c">Search</button>
                        </div>
                    </div>
                </form>
                <div class="search-story"></div>`;

    this.root.innerHTML = html;

    return this;
  }
}
