module.exports = function(source) {
    this.cacheable();
    const { modules } = this.query;
    const imports = modules.map(m => `require("${m}");`).join("\n");
    const augmentedSource = `
        if (!global["__snapshot"]) {
            ${imports}
        }

        ${source}
    `;

    this.callback(null, augmentedSource);
};
