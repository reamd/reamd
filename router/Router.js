/**
 * 构建路由对象
 */
function Router() {
  this.controller = []; //存储路由和方法  
}

/**
 * 路由初始化方法
 * @param {function} callback [[Description]]
 */
Router.prototype.init = function (callback) {
  callback.bind(this)();
  this.change();
  window.addEventListener('hashchange', function () {
    this.change();
  }.bind(this), false);
};

/**
 * url改变触发方法
 */
Router.prototype.change = function () {
  var me = this,aUrl = location.hash.split('?');
  var app = {
    pathName: aUrl[0],
    search: aUrl[1] || null,
    aHash: null,
    notFound: true, //true 页面不存在，404错误，false 页面存在
    init: function () {
      var aQueue = [],router,callback,queue,i;
      app.aHash = app.pathName.split('/');

      for (i = 0; i < me.controller.length; i++) {
        router = me.controller[i].router;
        callback = me.controller[i].callback;
        queue = {
          req: {
            query: app.getQuery(),
            param: null,
            router: router
          },
          callback: null
        };

        if (app.test(me.controller[i])) {
          queue.req.param = app.getParam(router);
          queue.callback = callback;
          aQueue.push(queue);
        } else if (router == undefined) {
          queue.callback = callback;
          aQueue.push(queue);
        }
      }

      for (i = 0; i < aQueue.length; i++) {
        router = aQueue[i].req.router;
        if (typeof (router) == 'string') { //路由存在
          aQueue[i].callback(aQueue[i].req);
        } else if (router == undefined && app.notFound) {
          aQueue[i].callback(aQueue[i].req);
        }
      }
    },
    test: function (controller) {
      var router = controller.router,
          bAll,
          sRe,
          bRe,
          bIndex;

      //error路由类型（undefined）
      if (typeof (router) !== 'string') {
        return false;
      }
      //通配符匹配模式(路由中间件)
      bAll = Boolean(router === '*');

      //首页单独匹配模式
      bIndex = Boolean(app.pathName === '' && router === '/');

      //正则匹配模式
      sRe = router.replace(/\/:[^\/]+/g, '\/([^\/]+)');//：id参数规则替换
      sRe = '^#' + sRe.replace(/\//g, '\\/') + '$';// /转义
      bRe = new RegExp(sRe).test(app.pathName);

      if (bRe || bIndex) {
        app.notFound = false;
      }

      return (bAll || bRe || bIndex);
    },
    getParam: function (router) {
      var param = {},aRouter;

      aRouter = router.split('/');
      aRouter.forEach(function(item, idx){
          if (/^:\w+$/.test(item)) {
              param[item.replace(/^:/, '')] = app.aHash[idx];
          }
      });

      return param;
    },
    getQuery: function () {
      var query = {}, arr;

      if (typeof (app.search) !== 'string') {
        return query;
      }

      arr = app.search.split('&');
      arr.forEach(function(item, idx){
          var aQuery = item.split('=');
          query[aQuery[0]] = aQuery[1] || null;
      });

      return query;
    }
  };
  app.init();
};

/**
 * 前端路由模拟get请求
 * @param {string} router   路由匹配规则
 * @param {function} callback 路由匹配成功后执行方法
 */
Router.prototype.get = function (router, callback) {
  var data = {
    router: router,
    callback: callback
  };
  this.controller.push(data);
};

/**
 * 路由中间件
 * @param {function} callback 执行方法
 */
Router.prototype.use = function (callback) {
  var data = {
    router: '*',
    callback: callback
  };
  this.controller.push(data);
};

/**
 * 404错误，页面不存在时执行
 * @param {function} callback 404错误时执行方法
 */
Router.prototype.error = function (callback) {
  var data = {
    router: undefined,
    callback: callback
  };
  this.controller.push(data);
};