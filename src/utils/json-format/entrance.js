import './prototypes';
import { createJsonFormatDealer } from './dealer';
import { escapeHtml, formatJsonString } from './format-utils';

let JsonFormatEntrance = (function () {
  'use strict';

  let jfContent, jfPre, jfStyleEl, jfOptEl, jfPathEl, formattingMsg;

  let lastKvovIdGiven = 0;
  let cachedJsonString = '';

  let _initElements = function () {
    const $ = window.$ || window.jQuery;
    jfContent = $('#jfContent');
    if (!jfContent[0]) {
      jfContent = $('<div id="jfContent" />').appendTo('body');
    }

    jfPre = $('#jfContent_pre');
    if (!jfPre[0]) {
      jfPre = $('<pre id="jfContent_pre" />').appendTo('body');
    }

    jfStyleEl = $('#jfStyleEl');
    if (!jfStyleEl[0]) {
      jfStyleEl = $('<style id="jfStyleEl" />').appendTo('head');
    }

    formattingMsg = $('#formattingMsg');
    if (!formattingMsg[0]) {
      formattingMsg = $(
        '<div id="formattingMsg"><span class="x-loading"></span>格式化中...</div>'
      ).appendTo('body');
    }

    jfOptEl = $('#boxOpt');
    if (!jfOptEl.length) {
      jfOptEl = $(
        '<div id="boxOpt"><a class="opt-copy">复制</a>|<a class="opt-del">删除</a></div>'
      ).appendTo('body');
    }

    try {
      jfContent.html('').show();
      jfPre.html('').hide();
      jfOptEl && jfOptEl.hide();
      jfPathEl && jfPathEl.hide();
      formattingMsg.hide();
    } catch (e) {
      console.log(e);
    }
  };

  // Add listener to receive response from BG when ready
  let postMessage = function (msg) {
    switch (msg[0]) {
      case 'NOT JSON':
        jfPre.show();
        jfContent.html('<span class="x-json-tips">JSON不合法，请检查：</span>');
        break;

      case 'FORMATTING':
        formattingMsg.show();
        break;

      case 'FORMATTED':
        formattingMsg.hide();
        jfContent.html(msg[1]);

        // _loadJs();
        _buildOptionBar();
        // 事件绑定
        _addEvents();
        // 支持文件下载
        // _downloadSupport(cachedJsonString);

        break;

      default:
        throw new Error('Message not understood: ' + msg[0]);
    }
  };

  const jsonFormatDealer = createJsonFormatDealer(postMessage);

  /**
   * 执行代码格式化
   * @param  {string} jsonStr [description]
   * @return {[type]}
   */
  let format = function (jsonStr) {
    cachedJsonString = formatJsonString(jsonStr, 4);

    _initElements();
    jfPre.html(escapeHtml(cachedJsonString));

    jsonFormatDealer.postMessage({
      type: 'SENDING TEXT',
      text: jsonStr,
      length: jsonStr.length,
    });
  };

  /**
   * chrome 下复制到剪贴板
   * @param text
   */
  let _copyToClipboard = function (text) {
    let input = document.createElement('textarea');
    input.style.position = 'fixed';
    input.style.opacity = 0;
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('Copy');
    document.body.removeChild(input);

    alert('Json片段复制成功，随处粘贴可用！');
  };

  /**
   * 从el中获取json文本
   * @param el
   * @returns {string}
   */
  let getJsonText = function (el) {
    let txt = el.text().replace(/":\s/gm, '":').replace(/,$/, '').trim();
    if (!(/^{/.test(txt) && /\}$/.test(txt)) && !(/^\[/.test(txt) && /\]$/.test(txt))) {
      txt = '{' + txt + '}';
    }
    try {
      txt = JSON.stringify(JSON.parse(txt), null, 4);
    } catch (err) {}

    return txt;
  };

  /**
   * 给某个节点增加操作项
   * @param el
   * @private
   */
  let _addOptForItem = function (el) {
    // 下载json片段
    let fnDownload = function () {
      let txt = getJsonText(el);
      // 下载片段
      let dt = new Date().format('yyyyMMddHHmmss');
      let blob = new Blob([txt], {
        type: 'application/octet-stream',
      });

      if (typeof chrome === 'undefined' || !chrome.permissions) {
        // 下载JSON的简单形式
        $(this)
          .attr('download', 'FeHelper-' + dt + '.json')
          .attr('href', URL.createObjectURL(blob));
      } else {
        // 请求权限
        chrome.permissions.request(
          {
            permissions: ['downloads'],
          },
          function (granted) {
            if (granted) {
              chrome.downloads.download({
                url: URL.createObjectURL(blob),
                saveAs: true,
                conflictAction: 'overwrite',
                filename: 'FeHelper-' + dt + '.json',
              });
            } else {
              alert('必须接受授权，才能正常下载！');
            }
          }
        );
      }
    };

    // 复制json片段
    let fnCopy = function () {
      _copyToClipboard(getJsonText(el));
    };

    // 删除json片段
    let fnDel = function () {
      if (el.parent().is('#formattedJson')) {
        alert('如果连最外层的Json也删掉的话，就没啥意义了哦！');
        return false;
      }
      alert('节点已删除成功！');
      el.remove();
      jfOptEl.css('top', -1000).hide();
      jfPathEl && jfPathEl.hide();
    };

    jfOptEl.find('a.opt-download').unbind('click').bind('click', fnDownload);
    jfOptEl.find('a.opt-copy').unbind('click').bind('click', fnCopy);
    jfOptEl.find('a.opt-del').unbind('click').bind('click', fnDel);

    jfOptEl
      .css({
        left: el.offset().left + el.width() - 90,
        top: el.offset().top,
      })
      .show();
  };

  /**
   * 折叠所有
   * @param elements
   */
  function collapse(elements) {
    let el;

    $.each(elements, function () {
      el = $(this);
      if (el.children('.blockInner').length) {
        el.addClass('collapsed');

        if (!el.attr('id')) {
          el.attr('id', 'kvov' + ++lastKvovIdGiven);

          let count = el.children('.blockInner').eq(0).children().length;
          // Generate comment text eg "4 items"
          let comment = count + (count === 1 ? ' item' : ' items');
          // Add CSS that targets it
          jfStyleEl[0].insertAdjacentHTML(
            'beforeend',
            '\n#kvov' +
              lastKvovIdGiven +
              '.collapsed:after{color: #aaa; content:" // ' +
              comment +
              '"}'
          );
        }
      }
    });
  }

  /**
   * 创建几个全局操作的按钮，置于页面右上角即可
   * @private
   */
  let _buildOptionBar = function () {
    let optionBar = $('#optionBar');
    if (optionBar) {
      optionBar.remove();
    }
    optionBar = $('<div id="optionBar" />').appendTo(jfContent.parent());

    let buttonFormatted = $('<button id="buttonFormatted">元数据</button>').appendTo(optionBar);
    let buttonCollapseAll = $('<button id="buttonCollapseAll">折叠所有</button>').appendTo(
      optionBar
    );
    let plainOn = false;

    buttonFormatted.bind('click', function () {
      if (plainOn) {
        plainOn = false;
        jfPre.hide();
        jfContent.show();
        buttonFormatted.text('元数据');
      } else {
        plainOn = true;
        jfPre.show();
        jfContent.hide();
        buttonFormatted.text('格式化');
      }

      jfOptEl && jfOptEl.hide();
      jfPathEl && jfPathEl.hide();
    });

    buttonCollapseAll.bind('click', function () {
      // 如果内容还没有格式化过，需要再格式化一下
      if (plainOn) {
        buttonFormatted.trigger('click');
      }

      if (buttonCollapseAll.text() === '折叠所有') {
        buttonCollapseAll.text('展开所有');
        collapse($('.objProp,.arrElem'));
      } else {
        buttonCollapseAll.text('折叠所有');
        $('.objProp,.arrElem').removeClass('collapsed');
      }
      jfOptEl && jfOptEl.hide();
      jfPathEl && jfPathEl.hide();
    });
  };

  // 显示当前节点的Key
  let _showJsonKey = function (curEl) {
    let keys = [];
    do {
      if (curEl.hasClass('arrElem')) {
        if (!curEl.hasClass('rootKvov')) {
          keys.unshift('[' + curEl.prevAll('.kvov').length + ']');
        }
      } else {
        keys.unshift(curEl.find('>.k').text());
      }

      if (curEl.parent().hasClass('rootKvov') || curEl.parent().parent().hasClass('rootKvov')) {
        break;
      }

      curEl = curEl.parent().parent();
    } while (curEl.length && !curEl.hasClass('rootKvov'));

    let path = keys.join('#@#').replace(/#@#\[/g, '[').replace(/#@#/g, '.');
    if (!jfPathEl) {
      jfPathEl = $('<div/>')
        .css({
          position: 'fixed',
          bottom: 0,
          left: 0,
          background: 'rgb(0, 0, 0,0.6)',
          color: '#ff0',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '2px 10px 2px 2px',
        })
        .appendTo('body');
    }
    jfPathEl.html('当前路径：' + path).show();
  };

  // 附加操作
  let _addEvents = function () {
    // 折叠、展开
    $('#jfContent span.e').bind('click', function (ev) {
      ev.preventDefault();

      let parentEl = $(this).parent();
      parentEl.toggleClass('collapsed');

      if (parentEl.hasClass('collapsed')) {
        collapse(parentEl);
      }
    });

    // 点击选中：高亮
    $('#jfContent .kvov')
      .bind('click', function (e) {
        if ($(this).hasClass('x-outline')) {
          jfOptEl && jfOptEl.hide();
          jfPathEl && jfPathEl.hide();
          $(this).removeClass('x-outline');
          e.stopPropagation();
          return true;
        }

        $('.x-outline').removeClass('x-outline');
        let el = $(this).removeClass('x-hover').addClass('x-outline');

        // 增加复制、删除功能
        _addOptForItem(el);
        // 显示key
        _showJsonKey(el);

        if (!$(e.target).is('.kvov .e')) {
          e.stopPropagation();
        } else {
          $(e.target).parent().trigger('click');
        }

        // 触发钩子
        if (typeof window._OnJsonItemClickByFH === 'function') {
          window._OnJsonItemClickByFH(getJsonText(el));
        }
      })
      .bind('mouseover', function () {
        $(this).addClass('x-hover');
        return false;
      })
      .bind('mouseout', function () {
        $(this).removeClass('x-hover');
      });
  };

  return {
    format: format,
    postMessage: postMessage,
  };
})();

export default JsonFormatEntrance.format;
