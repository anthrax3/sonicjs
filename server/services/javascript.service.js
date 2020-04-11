var globalService = require("./global.service");
var eventBusService = require("./event-bus.service");
var fileService = require("./file.service");
var dataService = require("./data.service");

var UglifyJS = require("uglify-es");

module.exports = javascriptService = {
  startup: async function () {
    eventBusService.on("getRenderedPagePostDataFetch", async function (
      options
    ) {
      if (options && options.page) {
        await javascriptService.getJsLinks(options);
      }
    });
  },

  // getGeneratedCss: async function () {

  //     var cssString = '';// 'body {background:lightblue;}';
  //     cssString = await this.processSections(cssString)
  //     var ast = css.parse(cssString);

  //     let cssFile = css.stringify(ast);
  //     return cssFile;
  // },

  getJsLinks: async function (options) {
    options.page.data.jsLinks = [];
    options.page.data.jsLinksList = [];


    await this.getJsAssets(options);

    await this.processJsLinksForDevMode(options);

    await this.processJsLinksForProdMode(options);
  },

  getJsAssets: async function (options) {
    let paths = [];
    if(globalService.isBackEnd){
      let assets = await dataService.getContentByContentTypeAndTitle('asset','js-back-end')
      this.addPaths(options, assets.data.paths);
    }

    if(globalService.isFrontEnd){
      let assets = await dataService.getContentByContentTypeAndTitle('asset','js-front-end')
      this.addPaths(options, assets.data.paths);
    }

    //add module js files
    await globalService.asyncForEach(
      globalService.moduleJsFiles,
      async (path) => {
        this.addPath(options, {path: path});
      }
    );
  },

  addPaths: function (options, paths) {
    paths.forEach(path => {
      this.addPath(options, path);
    });
  },

  addPath: function (options, path) {
      options.page.data.jsLinksList.push(path);
  },

  processJsLinksForDevMode: async function (options) {
    // return;
    if (process.env.MODE === "prod") return;

    await globalService.asyncForEach(
      options.page.data.jsLinksList,
      async (link) => {
        options.page.data.jsLinks += `<script src="${link.path}"></script>`;
      }
    );

  },

  processJsLinksForProdMode: async function (options) {
    // return;
        if (process.env.MODE !== "prod") return;

    var jsCode = "";

    await globalService.asyncForEach(
      options.page.data.jsLinksList,
      async (link) => {
        let fileContent = await fileService.getFile(link.path, true);
        jsCode += fileContent + "\n";
      }
    );

    await this.createCombinedJsFile(jsCode);

    let version = 1;
    options.page.data.jsLinks += `<script src="/js/combined.js?v=${version}"></script>`;

  },

  createCombinedJsFile: async function (minifiedJs) {
    let path = '/assets/js/combined.js';
    if(!(fileService.fileExists(path))){

      var minifiedCss = UglifyJS.minify(jsCode, {
        compress: {
          dead_code: true,
          global_defs: {
            DEBUG: false,
          },
        },
      });

      fileService.writeFile("../assets/js/combined.js", minifiedJs);
    }
  },

  // processSections: async function (cssString) {

  //     let sections = await dataService.getContentByContentType('section')
  //     sections.forEach(section => {
  //         if (section.data.background) {
  //             if (section.data.background.type === 'color') {
  //                 let color = section.data.background.color;
  //                 cssString += ` section[data-id="${section.id}"]{background-color:${color}}`
  //             }
  //         }
  //     });

  //     return cssString;
  // },

  // getJsFile: async function (page) {
  //     //get template.css
  //     let cssString = await fileService.getFile('storage/css/template.css');
  //     //parse the css
  //     var ast = csstree.parse(cssString);
  //     let cleanCss = csstree.generate(ast);
  //     let beatifulCss = cssbeautify(cleanCss);

  //     page.data.editor = { "css" : beatifulCss} ;
  // },
};
