<template>
  <div :class="$style.postman">
    <header class="u-c-middle u-link">
      <img class="m-logo u-w50" src="/icon.png" alt="icon" @click="toHome" />
      <em class="g-ml10 g-fs20">FE-TOOLS PostMan</em>
    </header>
    <section class="m-pm_inputs g-mt20">
      <div class="u-w800 g-center">
        <label for="url">接口地址：</label>
        <input
          id="url"
          ref="url"
          v-model="urlContent"
          type="text"
          class="form-control f-url"
          placeholder="请输入Api地址"
        />

        <span s-cr_blue class="u-pm_xdemo u-link g-ml10" @click="setDemo('GET')">Get示例</span>
        <span s-cr_blue class="u-pm_xdemo u-link" @click="setDemo('POST')">Post示例</span>
      </div>

      <div class="g-mt20 u-w800 g-center">
        <label for="method">请求方式：</label>
        <select id="method" v-model="methodContent" class="form-control f-method">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="HEAD">HEAD</option>
        </select>
      </div>

      <div v-if="methodContent === 'POST'" class="g-mt20 u-w800 g-center">
        <label for="contentType">Content-Type：</label>
        <select id="contentType" v-model="contentType" class="form-control f-method">
          <option value="application/x-www-form-urlencoded">
            application/x-www-form-urlencoded
          </option>
          <option value="multipart/form-data">multipart/form-data</option>
          <option value="application/json">application/json</option>
        </select>
      </div>

      <div v-if="methodContent === 'POST'" class="g-mt20 u-w800 g-center">
        <label for="param">请求参数：</label>
        <textarea
          id="param"
          v-model="paramContent"
          type="text"
          class="u-textarea"
          placeholder='请求参数, *格式{"key1":"value1","key2":"value2",...}或key1=value1&key2=value2...'
        />
      </div>

      <div class="g-mt20">
        <button s-color="blue" class="u-btn u-w300 u-h40 g-center" @click="postman">
          发送请求
        </button>
      </div>
    </section>

    <div class="g-mt50" :class="{ 'z-hide': !showTap }">
      <div id="tabs">
        <ul class="m-the-tabs u-c-middle">
          <li>
            <a :class="{ 'z-selected': tapType === 'data' }" @click="tapType = 'data'">数据</a>
          </li>
          <li>
            <a :class="{ 'z-selected': tapType === 'json' }" @click="tapType = 'json'">JSON</a>
          </li>
          <li>
            <a :class="{ 'z-selected': tapType === 'header' }" @click="tapType = 'header'"
              >响应头</a
            >
          </li>
        </ul>

        <div v-show="tapType === 'data'" id="tab-content" class="m-tab_ctn g-fs16">
          {{ resultContent }}
        </div>

        <div v-show="tapType === 'json'" id="tab-json" class="m-tab_ctn g-pr">
          <div id="formattingMsg"><span class="x-loading"></span>格式化中...</div>
          <div id="jfCallbackName_start" class="callback-name" v-html="jfCallbackName_start"></div>
          <div id="jfContent" v-html="errorMsgForJson || resultContent"></div>
          <pre id="jfContent_pre"></pre>
          <div id="jfCallbackName_end" class="callback-name" v-html="jfCallbackName_end"></div>
        </div>

        <div v-show="tapType === 'header'" id="tab-header" class="m-tab_ctn g-fs16">
          <table class="u-table table-hover">
            <thead>
              <tr>
                <th>序号</th>
                <th>头信息</th>
                <th>具体内容</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(h, index) in responseHeaders" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ h[0] }}</td>
                <td>{{ h[1] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import JSONFormat from '@/utils/json-format';

export default defineComponent({
  name: 'PostMan',
  data() {
    return {
      showTap: false, // 显示taps
      tapType: 'json', // tap类型

      contentType: 'application/x-www-form-urlencoded',
      urlContent: '',
      methodContent: 'GET',
      resultContent: '',
      paramContent: '',
      responseHeaders: [],
      jfCallbackName_start: '',
      jfCallbackName_end: '',
      errorMsgForJson: '',
    };
  },

  mounted() {
    (this.$refs.url as HTMLInputElement).focus();
  },

  methods: {
    toHome() {
      window.open('https://github.com/MichealWayne/fe-tools');
    },

    postman: function () {
      this.$nextTick(() => {
        this.sendRequest(this.urlContent, this.methodContent, this.paramContent);
      });
    },

    sendRequest: function (url: string, method: string, body: string) {
      let xhr = new XMLHttpRequest();
      if (body) {
        body = body.trim();
        if (body[0] === '{') {
          // json格式
          try {
            body = JSON.parse(body);
          } catch (e) {
            alert('参数格式有误(' + (e as Error).message + ')');
          }
          if (this.contentType === 'multipart/form-data') {
            let fd = new FormData();
            for (let i in body) {
              fd.append(i, body[i]);
            }
            body = fd;
          } else {
            let arr = [];
            for (let i in body) {
              arr.push(i + '=' + body[i]);
            }
            body = arr.join('&');
          }
        }
      }

      // @todo
      xhr.addEventListener('readystatechange', (resp: any) => {
        let result = 'Loading...';
        switch (resp.target.readyState) {
          case resp.target.OPENED:
            result = 'Senting...';
            break;
          case resp.target.HEADERS_RECEIVED:
            result = 'Headers received';
            this.responseHeaders = resp.target
              .getAllResponseHeaders()
              .trim()
              .split('\n')
              .map(item => {
                return item.split(': ').map(x => x.trim());
              });
            break;
          case resp.target.LOADING:
            result = 'Loading...';
            break;
          case resp.target.DONE:
            try {
              result = JSON.stringify(JSON.parse(resp.target.responseText), null, 4);
            } catch (e) {
              result = resp.target.responseText;
            }

            this.jsonFormat(result);
            this.showTap = true;
            break;
        }
        this.resultContent = result || '无数据';
      });
      xhr.open(method, url);
      if (method.toLowerCase() === 'post') {
        xhr.setRequestHeader('Content-Type', this.contentType);
        xhr.send(body);
      } else {
        xhr.send();
      }
    },

    jsonFormat: function (source: string) {
      this.errorMsgForJson = '';
      this.jfCallbackName_start = '';
      this.jfCallbackName_end = '';

      if (!source) {
        return false;
      }

      // JSONP形式下的callback name
      let funcName = null;
      // json对象
      let jsonObj = null;

      // 下面校验给定字符串是否为一个合法的json
      try {
        // 再看看是不是jsonp的格式
        let reg = /^([\w\.]+)\(\s*([\s\S]*)\s*\)$/gim;
        let matches = reg.exec(source);
        if (matches != null) {
          funcName = matches[1];
          source = matches[2];
        }
        // 这里可能会throw exception
        jsonObj = JSON.parse(source);
      } catch (ex) {
        // new Function的方式，能自动给key补全双引号，但是不支持bigint，所以是下下策，放在try-catch里搞
        try {
          jsonObj = new Function('return ' + source)();
        } catch (exx) {
          this.tapType = 'data';
          try {
            // 再给你一次机会，是不是下面这种情况：  "{\"ret\":\"0\", \"msg\":\"ok\"}"
            jsonObj = new Function("return '" + source + "'")();
            if (typeof jsonObj === 'string') {
              jsonObj = new Function('return ' + jsonObj)();
            }
          } catch (exxx) {
            this.errorMsgForJson = exxx.message;
          }
        }
      }

      // 是json格式，可以进行JSON自动格式化
      if (jsonObj != null && typeof jsonObj === 'object' && !this.errorMsgForJson.length) {
        try {
          // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
          source = JSON.stringify(jsonObj);
        } catch (ex) {
          // 通过JSON反解不出来的，一定有问题
          this.errorMsgForJson = ex.message;
        }

        if (!this.errorMsgForJson.length) {
          // 格式化
          JSONFormat(source);

          // 如果是JSONP格式的，需要把方法名也显示出来
          if (funcName != null) {
            this.jfCallbackName_start = funcName + '(';
            this.jfCallbackName_end = ')';
          } else {
            this.jfCallbackName_start = '';
            this.jfCallbackName_end = '';
          }
        }
      }

      // 不是json，都格式化不了，一定会出错
      if (this.errorMsgForJson) {
        let el = document.querySelector('#optionBar');
        el && (el.style.display = 'none');
      }
    },

    setDemo: function (type: string) {
      switch (type) {
        case 'GET':
          this.urlContent = 'https://blog.michealwayne.cn/fe-tools/package.json';
          this.methodContent = 'GET';
          break;
        case 'POST':
          this.urlContent = 'https://www.baidufe.com/test-post.php';
          this.methodContent = 'POST';
          this.paramContent = 'username=postman&password=123456';
          break;
        default:
          return;
      }
    },
  },
});
</script>

<style lang="less" module>
.postman {
  margin: 0 auto;
  padding: 20px;
  width: 1000px;
  background-color: #fff;
}
</style>

<style lang="less">
.m-pm_inputs {
  margin-top: 20px;
  font-size: 18px;

  input {
    padding: 10px;
    width: 500px;
    font-size: 16px;
    border: 1px solid #e2e2e2;
  }
  label {
    vertical-align: top;
  }
  .u-textarea {
    padding: 10px;
    width: 500px;
    min-height: 100px;
    font-size: 16px;
    border: 1px solid #e2e2e2;
  }

  .u-pm_xdemo {
    font-size: 14px;
  }
}
.m-the-tabs {
  a {
    display: block;
    width: 100px;
    height: 40px;
    line-height: 40px;
    color: #666;
    font-size: 14px;
    text-align: center;
    border: 1px solid #e2e2e2;
    border-bottom: 0 none;
    cursor: pointer;

    &.z-selected {
      color: #2969f7;
    }
  }
}
.m-tab_ctn {
  padding: 20px;
  min-height: 500px;
  border: 1px solid #e2e2e2;

  .u-table {
    width: 100%;
    td {
      border-top: 1px solid #e2e2e2;
    }
    th,
    td {
      height: 40px;
      line-height: 40px;
    }
  }
}

#jfContent {
  -webkit-user-select: text;
  margin: 0;
}
#optionBar {
  -webkit-user-select: none;
  display: block;
  position: absolute;
  top: 0px;
  right: 0px;
}
#buttonFormatted,
#buttonCollapseAll,
#btnDownload {
  cursor: pointer;
  -webkit-border-radius: 2px;
  -webkit-box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
  -webkit-user-select: none;
  background: -webkit-linear-gradient(#fafafa, #f4f4f4 40%, #e5e5e5);
  outline: none;
  border: 1px solid #aaa;
  color: #444;
  font-size: 12px;
  margin-bottom: 0px;
  min-width: 4em;
  padding: 0px 10px;
  position: relative;
  z-index: 10;
  display: inline-block;
  height: 30px;
  text-shadow: 1px 1px rgba(255, 255, 255, 0.3);
}
#buttonCollapseAll,
#btnDownload {
  margin-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
#buttonFormatted,
#buttonCollapseAll {
  margin-right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}
#buttonFormatted:hover,
#btnDownload:hover,
#buttonCollapseAll:hover {
  -webkit-box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2);
  background: #ebebeb -webkit-linear-gradient(#fefefe, #f8f8f8 40%, #e9e9e9);
  border-color: #999;
  color: #222;
}
#buttonFormatted:active {
  -webkit-box-shadow: inset 0px 1px 3px rgba(0, 0, 0, 0.2);
  background: #ebebeb -webkit-linear-gradient(#f4f4f4, #efefef 40%, #dcdcdc);
  color: #333;
}
#buttonFormatted.selected,
#buttonCollapseAll.selected {
  -webkit-box-shadow: inset 0px 1px 5px rgba(0, 0, 0, 0.2);
  background: #ebebeb -webkit-linear-gradient(#e4e4e4, #dfdfdf 40%, #dcdcdc);
  color: #333;
}
#jsonpOpener,
#jsonpCloser {
  padding: 4px 0 0 8px;
  color: black;
  margin-bottom: -6px;
}
#jsonpCloser {
  margin-top: 0;
}
#formattedJson {
  padding-left: 28px;
  padding-top: 6px;
}
pre {
  padding: 36px 5px 5px 5px;
}
.kvov {
  display: block;
  padding-left: 20px;
  margin-left: -20px;
  position: relative;
  padding-top: 2px;
}

#jfContent {
  margin-bottom: 25px;
}
#jfContent .kvov .s a {
  color: #00b;
  text-decoration: underline;
}
#jfContent .kvov .s a:hover {
  color: #b00;
}
.collapsed {
  white-space: nowrap;
}
.collapsed > .blockInner {
  display: none;
}
.collapsed > .ell:after {
  content: '\2026';
  font-weight: bold;
}
.collapsed > .ell {
  margin: 0 4px;
  color: #888;
}
.collapsed .kvov {
  display: inline;
}
.e {
  width: 20px;
  height: 18px;
  display: block;
  position: absolute;
  left: -2px;
  top: 4px;
  z-index: 5;
  opacity: 0.35;
  -webkit-user-select: none;
  cursor: pointer;
}
.e:after {
  content: '\25bc';
}
.collapsed > .e {
  -webkit-transform: rotate(-90deg);
  top: -1px;
}
.e:hover {
  opacity: 0.35;
}
.e:active {
  opacity: 0.5;
}
.collapsed .kvov .e {
  display: none;
}
.blockInner {
  display: block;
  padding-left: 24px;
  border-left: 1px dotted #bbb;
  margin-left: 2px;
}
#formattedJson,
#jsonpOpener,
#jsonpCloser {
  color: #333;
  font: 13px/18px monospace;
}
#formattedJson {
  color: #444;
}
.b {
  font-weight: bold;
}
.s {
  color: #0b7500;
  word-wrap: break-word;
}
#jfContent a:link,
#jfContent a:visited {
  text-decoration: none;
  color: inherit;
}
#jfContent a:hover,
#jfContent a:active {
  text-decoration: underline;
  color: #050;
}
.bl,
.nl,
.n {
  font-weight: bold;
  color: #1a01cc;
}
.k {
  color: black;
}
#formattingMsg {
  display: none;
}
#formattingMsg .x-loading {
  width: 12px;
  height: 12px;
  border: 1px solid #f00;
  border-radius: 50%;
  box-shadow: 0 0 10px 2px;
  color: #cc0000;
  border-right-color: transparent;
  border-top-color: transparent;
  animation: spin-right 1s linear infinite normal;
  animation-delay: 0s;
  margin: 0 5px 0 0;
  display: inline-block;
}
#formattingMsg .x-loading:before {
  display: block;
  width: 8px;
  height: 8px;
  margin: 1px;
  border: 2px solid #f00;
  content: ' ';
  border-radius: 50%;
  border-left-color: transparent;
  border-bottom-color: transparent;
}
@keyframes spin-right {
  from {
    transform: rotate(0deg);
    opacity: 0.2;
  }
  50% {
    transform: rotate(180deg);
    opacity: 1;
  }
  to {
    transform: rotate(360deg);
    opacity: 0.2;
  }
}

[hidden] {
  display: none !important;
}
#jfContentspan {
  white-space: pre-wrap;
}
#jfContent .x-json-tips {
  color: red;
}
#jfContent_pre {
  padding: 0;
  margin: 0;
  word-break: break-word;
}

.mod-json .format-item button {
  width: 80px;
  height: 30px;
  float: right;
}
.mod-json .rst-item {
  position: relative;
  padding-top: 30px;
}
#jsonSource {
  height: 120px;
}
.mod-json .callback-name {
  font-weight: bolder;
  color: #a00;
}

#jfContent .x-hover {
  outline: 1px solid #cdc;
  background: #fff;
}
#jfContent .x-outline {
  outline: 1px solid #8ac;
  box-shadow: rgba(100, 100, 100, 0.4) -3px 3px 5px;
  font-weight: bold;
  background-color: #fffff8;
}
</style>
