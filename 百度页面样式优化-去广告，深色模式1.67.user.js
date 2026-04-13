// ==UserScript==
// @name         百度全页面样式优化-去广告，深色模式
// @namespace    http://tampermonkey.net/
// @version      1.68
// @icon         https://www.baidu.com/favicon.ico
// @description  添加单双列布局切换，官网置顶功能，优化百度官方标识识别，增加深色模式切换，移除百度搜索结果跳转页面，并加宽搜索结果。
// @author       Ai-Rcccccccc (Enhanced)
// @match        *://www.baidu.com/*
// @match        *://www1.baidu.com/*
// @match        *://m.baidu.com/*
// @match        *://xueshu.baidu.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @connect      baidu.com
// @connect      www.baidu.com
// @connect      m.baidu.com
// @connect      xueshu.baidu.com
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // ==============================================
    // 1. 遮罩拦截与加载动画
    // ==============================================
    const hideStyle = document.createElement('style');
    hideStyle.textContent = '.search-quit-dialog-wrap, ._2lMH_ { display: none !important; opacity: 0 !important; }';
    (document.head || document.documentElement).appendChild(hideStyle);

    function blockOverlays() {
        const allElements = document.querySelectorAll('*');
        let blockedCount = 0;

        allElements.forEach(el => {
            if (el.id === 'gm-loading' || el.id === 'settings-panel' || el.id === 'settings-toggle' || el.id === 'back-to-top' || el.id?.includes('gm-')) return;

            const style = window.getComputedStyle(el);
            if (
                (style.position === 'fixed' || style.position === 'absolute') &&
                parseInt(style.zIndex) > 100 &&
                el.offsetWidth > window.innerWidth * 0.75 &&
                el.offsetHeight > window.innerHeight * 0.75 &&
                (style.backgroundColor.includes('rgba') || parseFloat(style.opacity) < 1 || style.backdropFilter !== 'none' ||
                 el.classList.contains('search-quit-dialog-wrap') || el.classList.contains('_2lMH_'))
            ) {
                el.style.cssText = 'display: none !important; visibility: hidden !important;';
                blockedCount++;
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', blockOverlays);
    } else {
        blockOverlays();
    }

    window.addEventListener('load', () => {
        setTimeout(blockOverlays, 500);
        setTimeout(blockOverlays, 2000);
    });

    document.addEventListener('click', function(e) {
        if (e.target.closest('.tag-item_3Z1mA, .tag-common_8ztfL, [class*="tag-"]')) {
            setTimeout(blockOverlays, 100);
            setTimeout(blockOverlays, 500);
        }
    }, true);

    let checkCount = 0;
    const maxChecks = 10;
    const intervalId = setInterval(() => {
        checkCount++;
        blockOverlays();
        if (checkCount >= maxChecks) clearInterval(intervalId);
    }, 1000);

    let mutationTimeout = null;
    new MutationObserver(mutations => {
        if (mutationTimeout) return;
        mutationTimeout = setTimeout(() => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && (node.classList?.contains('search-quit-dialog-wrap') || node.classList?.contains('_2lMH_'))) {
                        node.remove();
                    }
                });
            });
            mutationTimeout = null;
        }, 50);
    }).observe(document.documentElement, { childList: true, subtree: false });

    document.addEventListener('click', function(e) {
        if (e.target.closest('.tag-item_3Z1mA, .tag-common_8ztfL, [class*="tag-"]')) {
            let loader = document.getElementById('gm-loading');
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'gm-loading';
                const isDark = document.body.classList.contains('dark-mode');
                const textColor = isDark ? '#e8e6e3' : '#666';

                loader.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999999;display:flex;align-items:center;flex-direction:column;';
                loader.innerHTML =
                    '<div style="display:flex;gap:8px;">' +
                        '<div style="width:12px;height:12px;background:#4e6ef2;border-radius:50%;animation:bounce 1.4s ease-in-out infinite;box-shadow:0 2px 6px rgba(78,110,242,0.4);"></div>' +
                        '<div style="width:12px;height:12px;background:#4e6ef2;border-radius:50%;animation:bounce 1.4s ease-in-out 0.2s infinite;box-shadow:0 2px 6px rgba(78,110,242,0.4);"></div>' +
                        '<div style="width:12px;height:12px;background:#4e6ef2;border-radius:50%;animation:bounce 1.4s ease-in-out 0.4s infinite;box-shadow:0 2px 6px rgba(78,110,242,0.4);"></div>' +
                    '</div>' +
                    '<div style="margin-top:15px;font-size:14px;color:' + textColor + ';font-weight:500;text-shadow:0 1px 3px rgba(0,0,0,0.2);">加载中...</div>' +
                    '<style>@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-12px); } }</style>';
                document.body.appendChild(loader);
            }
            loader.style.display = 'flex';
            setTimeout(() => {
                const obs = new MutationObserver(() => {
                    loader.style.display = 'none';
                    obs.disconnect();
                });
                obs.observe(document.querySelector('#content_left') || document.body, {childList:true, subtree:true});
                setTimeout(() => loader.style.display = 'none', 3000);
            }, 50);
        }
    }, true);

    const observer = new MutationObserver(() => {
        if (document.body && window.location.host !== 'm.baidu.com') {
            document.body.style.opacity = '0';
            observer.disconnect();
        }
    });
    observer.observe(document.documentElement, { childList: true });

    // ==============================================
    // 2. 链接重写与重定向
    // ==============================================
    function getUrlAttribute(baseUrl = location.href, attribute, needDecode = true) {
        const [, search = ''] = baseUrl.split("?");
        const searchValue = search.split("&");
        for (let i = 0; i < searchValue.length; i++) {
            const [key, value] = searchValue[i].split("=");
            if (key === attribute) return needDecode ? decodeURIComponent(value) : value;
        }
        return "";
    }

    function Reg_Get(HTML, reg) {
        try { return new RegExp(reg).exec(HTML)[1]; } catch (e) { return ""; }
    }

    function removeMobileBaiduDirectLink() {
        document.querySelectorAll("#page #page-bd #results .result:not([ac_redirectStatus])").forEach(curNode => {
            try {
                const logData = curNode.getAttribute('data-log');
                if (!logData) return;
                const curData = JSON.parse(logData.replace(/'/gm, '"'));
                const trueLink = curData.mu;
                if (trueLink) {
                    const article = curNode.querySelector("article");
                    if (article) article.setAttribute("rl-link-href", trueLink);
                    curNode.querySelectorAll("a").forEach(a => {
                        a.setAttribute("data-original-href", a.href);
                        a.setAttribute("href", trueLink);
                    });
                }
                curNode.setAttribute("ac_redirectStatus", "1");
            } catch (e) {}
        });
    }

    function remove_xueshuBaidu() {
        if (location.host.includes('xueshu.baidu')) {
            document.querySelectorAll("a[href*='sc_vurl=http']").forEach(node => {
                const xurl = getUrlAttribute(node.href, "sc_vurl", true);
                if (xurl) {
                    node.setAttribute("data-original-href", node.href);
                    node.href = xurl;
                }
            });
        }
    }

    function resetURLNormal() {
        if (location.host.includes('m.baidu')) { removeMobileBaiduDirectLink(); return; }

        const hasDealHrefSet = new Set();
        document.querySelectorAll("#content_left>.c-container").forEach(curNode => {
            if (curNode.getAttribute("ac_redirectStatus") !== null) return;
            curNode.setAttribute("ac_redirectStatus", "0");

            const linkNode = curNode.querySelector("h3.t>a, .c-container article a");
            if (!linkNode || !linkNode.href) return;

            let linkHref = linkNode.href;
            if (hasDealHrefSet.has(linkHref)) return;
            hasDealHrefSet.add(linkHref);

            if (linkHref.startsWith('javascript') || linkHref.startsWith('#')) return;

            let trueLink = curNode.getAttribute('mu') || linkNode.getAttribute('data-mdurl');
            if (trueLink && !trueLink.includes('nourl')) {
                if (trueLink.includes('baidu.com')) {
                    const [, first = ''] = /(ie=[^&]+)/.exec(location.search) || [];
                    trueLink = trueLink.replace(/(ie=[^&]+)/, first);
                }
                dealRedirect(null, linkHref, trueLink, linkNode);
                return;
            }

            if (linkHref.includes("www.baidu.com/link")) {
                let url = linkHref.replace(/^http:/, "https:");
                if (!url.includes("eqid")) url = url + "&wd=&eqid=";
                GM_xmlhttpRequest({
                    url: url,
                    headers: { "Accept": "*/*", "Referer": linkHref.replace(/^http:/, "https:") },
                    method: "GET",
                    timeout: 8000,
                    onload: function(response) {
                        if (response.responseText || response.responseHeaders) {
                            let resultResponseUrl = Reg_Get(response.responseText, "URL='([^']+)'");
                            if (!resultResponseUrl && response.responseHeaders.includes("tm-finalurl")) {
                                resultResponseUrl = Reg_Get(response.responseHeaders, "tm-finalurl\\w+: ([^\\s]+)");
                            }
                            dealRedirect(this, linkHref, resultResponseUrl, linkNode);
                        }
                    }
                });
            }
        });
    }

    function dealRedirect(request, curNodeHref, resultResponseUrl, linkNode) {
        if (!resultResponseUrl || resultResponseUrl.includes("www.baidu.com/link")) return;
        try {
            if (linkNode) {
                linkNode.setAttribute("data-original-href", linkNode.href);
                linkNode.href = resultResponseUrl;
                if (linkNode.text && linkNode.text.length < 10 && !linkNode.parentElement.tagName.toLowerCase().startsWith("h")) {
                    const host = new URL(resultResponseUrl).hostname;
                    if (!linkNode.textContent.includes(host)) {
                        const hostSpan = document.createElement('span');
                        hostSpan.className = 'gm-host-name';
                        hostSpan.textContent = host;
                        const separator = document.createElement('span');
                        separator.className = 'gm-host-separator';
                        separator.textContent = ' - ';
                        linkNode.parentNode.insertBefore(separator, linkNode.nextSibling);
                        linkNode.parentNode.insertBefore(hostSpan, separator.nextSibling);
                    }
                }
            }
            if (request && typeof request.abort === 'function') request.abort();
        } catch (e) {}
    }

    function processRedirects() {
        remove_xueshuBaidu();
        resetURLNormal();
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.85); color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; z-index: 10001; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // ==============================================
    // 3. 自动翻页模块
    // ==============================================
    window.AutoPagination = {
        isLoading: false, currentPage: 1, currentPn: 0, maxPage: 50, hasMore: true, enabled: false, scrollHandler: null,
        enable() {
            this.enabled = true;
            this.currentPn = parseInt(new URLSearchParams(window.location.search).get('pn') || '0');
            this.bindScrollEvent();
            this.addLoadingIndicator();
        },
        disable() {
            this.enabled = false;
            if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);
        },
        bindScrollEvent() {
            if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);
            let scrollTimer = null;
            this.scrollHandler = () => {
                if (!this.enabled) return;
                if (scrollTimer) clearTimeout(scrollTimer);
                scrollTimer = setTimeout(() => this.checkAndLoad(), 100);
            };
            window.addEventListener('scroll', this.scrollHandler);
        },
        checkAndLoad() {
            if (!this.enabled || this.isLoading || this.currentPage >= this.maxPage || !this.hasMore) return;
            const distanceToBottom = document.documentElement.scrollHeight - (window.pageYOffset || document.documentElement.scrollTop) - window.innerHeight;
            if (distanceToBottom < 500) this.loadNextPage();
        },
        loadNextPage() {
            this.isLoading = true;
            this.showLoading(true, '正在加载下一页...');
            this.currentPn += 10;
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set('pn', this.currentPn.toString());

            GM_xmlhttpRequest({
                method: 'GET', url: nextUrl.toString(),
                onload: (response) => {
                    try {
                        const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                        const results = doc.querySelectorAll('#content_left > div');
                        const contentLeft = document.querySelector('#content_left');
                        if (!contentLeft) throw new Error('未找到');
                        let addedCount = 0;
                        let currentPageElement = document.querySelector('#page');

                        results.forEach(result => {
                            const isAd = result.classList.contains('EC_result') || result.classList.contains('ec_result') || result.hasAttribute('data-tuiguang') || result.hasAttribute('data-placeid') || result.hasAttribute('data-cmatchid');
                            const isSearchResult = result.classList.contains('c-container') || result.classList.contains('result') || result.classList.contains('result-op');
                            if (isAd || result.id === 'page' || result.id === 'rs' || !isSearchResult) return;

                            const clonedResult = result.cloneNode(true);
                            clonedResult.removeAttribute('ac_redirectStatus');
                            currentPageElement = document.querySelector('#page');

                            if (currentPageElement && currentPageElement.parentNode === contentLeft) {
                                contentLeft.insertBefore(clonedResult, currentPageElement);
                            } else {
                                const allResults = contentLeft.querySelectorAll('.c-container, .result, .result-op');
                                if (allResults.length > 0) allResults[allResults.length - 1].after(clonedResult);
                                else contentLeft.appendChild(clonedResult);
                            }
                            addedCount++;
                        });

                        const newPage = doc.querySelector('#page');
                        if (newPage) {
                            if (currentPageElement) currentPageElement.replaceWith(newPage.cloneNode(true));
                            else contentLeft.appendChild(newPage.cloneNode(true));
                        } else this.hasMore = false;

                        if (typeof processRedirects === 'function') processRedirects();
                        this.currentPage++;
                        this.showLoading(false, `✅ 已加载第 ${this.currentPage} 页 (${addedCount}条)`);
                    } catch (e) { this.showLoading(false, '❌ 加载失败'); }
                    this.isLoading = false;
                },
                onerror: () => {
                    this.showLoading(false, '❌ 网络错误');
                    this.isLoading = false;
                    this.hasMore = false;
                }
            });
        },
        addLoadingIndicator() {
            if (!document.querySelector('.gm-auto-page-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'gm-auto-page-indicator';
                indicator.textContent = '加载中...';
                document.body.appendChild(indicator);
            }
        },
        showLoading(show, text = '加载中...') {
            const indicator = document.querySelector('.gm-auto-page-indicator');
            if (!indicator) return;
            indicator.textContent = text;
            indicator.style.display = 'block';
            if (!show) setTimeout(() => indicator.style.display = 'none', 1500);
        }
    };
        // ==============================================
    // 4. 界面与CSS注入
    // ==============================================
    const customSearchBoxHTML =
        '<div class="gm-search-container">' +
        '<input class="gm-search-input" type="text" maxlength="255" autocomplete="off" placeholder="请输入搜索内容">' +
        '<button class="gm-search-button">百度一下</button>' +
        '</div>';

    const commonStyles =
        '#gm-loading-overlay { ' +
        'position: fixed !important; top: 0 !important; left: 0 !important; ' +
        'width: 100% !important; height: 100% !important; ' +
        'background: rgba(255, 255, 255, 0.95) !important; ' +
        'z-index: 999999 !important; display: none !important; ' +
        'flex-direction: column !important; align-items: center !important; ' +
        'justify-content: center !important; }' +
        '.gm-loading-spinner { ' +
        'width: 50px !important; height: 50px !important; ' +
        'border: 4px solid #e0e0e0 !important; ' +
        'border-top-color: #4e6ef2 !important; ' +
        'border-radius: 50% !important; ' +
        'animation: gm-spin 0.8s linear infinite !important; }' +
        '.gm-loading-text { ' +
        'margin-top: 20px !important; font-size: 16px !important; ' +
        'color: #666 !important; font-weight: 500 !important; }' +
        '@keyframes gm-spin { ' +
        '0% { transform: rotate(0deg); } ' +
        '100% { transform: rotate(360deg); } }' +
        'body.dark-mode #gm-loading-overlay { ' +
        'background: rgba(26, 26, 26, 0.95) !important; }' +
        'body.dark-mode .gm-loading-text { color: #e8e6e3 !important; }' +
        'body.dark-mode .gm-loading-spinner { ' +
        'border-color: #444 !important; border-top-color: #4e6ef2 !important; }' +

        '.gm-search-input { width: 600px; height: 42px; padding-left: 25px; border: 1px solid #c4c7ce !important; box-sizing: border-box !important; border-right: none !important; outline: none !important; font-size: 16px; color: #000; background: #fff; border-radius: 24px 0 0 24px; -webkit-appearance: none; }' +
        '.gm-search-input:focus { border-color: #4e6ef2 !important; outline: none !important; box-shadow: none !important; }' +
        '.gm-search-button { height: 42px; padding: 0 25px; border: none !important; box-sizing: border-box !important; outline: none !important; cursor: pointer; font-size: 17px; background: #4e6ef2; border-radius: 0 24px 24px 0; color: #fff; display: flex; align-items: center; justify-content: center; white-space: nowrap; }' +
        '.gm-search-button:hover { background: #3079e8; }' +

        'body #content_left .c-container .gm-official-hint { ' +
        'position: absolute !important; left: 0 !important; bottom: 0 !important; top: auto !important; right: auto !important; ' +
        'width: auto !important; min-width: 0 !important; max-width: none !important; height: 30px !important; line-height: 30px !important; ' +
        'padding: 0 12px !important; margin: 0 !important; background: #4e6ef2 !important; color: white !important; ' +
        'border-radius: 0 10px 0 0 !important; font-size: 13px !important; ' +
        'box-shadow: 2px -2px 5px rgba(0,0,0,0.1) !important; z-index: 999 !important; flex: none !important; }' +
        '.gm-host-name { color: #666; font-size: 13px; margin-left: 4px; }' +
        '.gm-host-separator { color: #999; }' +
        'body.dark-mode .gm-host-name { color: #aaa; }' +
        'body.dark-mode .gm-host-separator { color: #777; }' +

        'body.single-column #container.sam_newgrid, body.single-column #content_left, body.single-column .wrapper_new #content_left, body.single-column #container.sam_newgrid #content_left { width: 100% !important; max-width: 1200px !important; margin: 0 auto !important; padding: 0 !important; display: flex !important; flex-direction: column !important; align-items: center !important; }' +
        'body.single-column .c-container, body.single-column .result-op, body.single-column .result { width: 100% !important; max-width: 800px !important; margin: 0 auto 25px auto !important; padding: 25px !important; border-radius: 10px !important; box-shadow: 0 3px 10px rgba(0,0,0,0.08) !important; background-color: #fff !important; transition: all 0.3s ease !important; box-sizing: border-box !important; position: relative !important; }' +
        'body.single-column #content_left > .c-container:first-child { margin-top: 30px !important; }' +

        'body.single-column div[class*="site-img"], body.single-column div[class*="site-img"] *, body.single-column .c-img-s { width: 16px !important; height: 16px !important; max-width: 16px !important; min-width: 16px !important; overflow: hidden !important; }' +

        'body.double-column #container.sam_newgrid, body.double-column #content_left, body.double-column .wrapper_new #content_left, body.double-column #container.sam_newgrid #content_left { width: 100% !important; max-width: 1400px !important; margin: 0 auto !important; padding: 10px !important; display: flex !important; flex-wrap: wrap !important; gap: 20px !important; align-items: stretch !important; justify-content: space-between !important; }' +
        'body.double-column .c-container, body.double-column .result-op, body.double-column .result { width: calc(50% - 10px) !important; margin: 0 !important; padding: 20px !important; border-radius: 10px !important; box-shadow: 0 3px 10px rgba(0,0,0,0.08) !important; background-color: #fff !important; transition: all 0.3s ease !important; box-sizing: border-box !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; max-height: 380px !important; position: relative !important; }' +

        'body.double-column #content_left > .c-container:first-child, body.double-column #content_left > .result:first-child, body.double-column #content_left > .result-op:first-child { width: calc(50% - 10px) !important; max-width: calc(50% - 10px) !important; flex: 0 0 calc(50% - 10px) !important; margin: 0 !important; }' +
        'body.double-column #content_left > .c-container:first-child *, body.double-column #content_left > .result:first-child *, body.double-column #content_left > .result-op:first-child * { max-width: 100% !important; }' +

        'body.double-column .c-abstract, body.double-column .c-span-last { max-height: 4.8em !important; overflow: hidden !important; display: -webkit-box !important; -webkit-line-clamp: 3 !important; -webkit-box-orient: vertical !important; line-height: 1.6 !important; }' +
        'body.double-column h3.t, body.double-column h3[class*="title"] { font-size: 16px !important; line-height: 1.4 !important; margin-bottom: 10px !important; max-height: 2.8em !important; overflow: hidden !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; }' +

        'body.double-column .c-container *, body.double-column .result-op *, body.double-column .result * { max-width: 100% !important; box-sizing: border-box !important; word-wrap: break-word !important; }' +
        'body.double-column h3, body.double-column h3 a { display: block !important; word-break: break-word !important; white-space: normal !important; }' +

        'body.double-column img, body.double-column video { max-width: 100% !important; max-height: 200px !important; height: auto !important; display: block !important; object-fit: cover !important; }' +
        'body.double-column .c-img, body.double-column .c-img6 { max-height: 200px !important; overflow: hidden !important; }' +

        'body.double-column .c-group-wrapper, ' +
        'body.double-column div[tpl*="baike"], ' +
        'body.double-column div[data-module="baike"], ' +
        'body.double-column .pc-fresh-wrapper-con, ' +
        'body.double-column .c-container[tpl="kg_entity_card"] ' +
        '{ overflow: visible !important; max-height: none !important; height: auto !important; display: block !important; }' +

        'body.double-column .c-container.pc-fresh-wrapper-con, ' +
        'body.double-column .c-container.c-group-wrapper, ' +
        'body.double-column .c-container[tpl="kg_entity_card"] ' +
        '{ width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; margin-bottom: 20px !important; }' +

        'body.double-column .c-group-wrapper .c-group-inner, ' +
        'body.double-column .c-group-wrapper ._content_1ml43_4, ' +
        'body.double-column .c-group-wrapper .content_309tE, ' +
        'body.double-column .pc-fresh-wrapper-con .c-group-inner ' +
        '{ width: 100% !important; padding: 15px !important; max-height: none !important; overflow: visible !important; }' +
        'body.double-column ._bg-header_1ml43_46 { width: 100% !important; padding: 15px 15px 0 15px !important; }' +
        'body.double-column .c-group-wrapper .sc-paragraph { max-height: 4.8em !important; overflow: hidden !important; display: -webkit-box !important; -webkit-line-clamp: 3 !important; -webkit-box-orient: vertical !important; }' +

        'body.double-column div[tpl*="soft"], body.double-column .result[tpl="soft"] { max-height: 350px !important; }' +
        'body.double-column div[tpl*="video"], body.double-column .result[tpl*="video"] { max-height: 380px !important; }' +
        'body.double-column iframe, body.double-column video { max-height: 180px !important; }' +

        'body.double-column .c-img-border { max-height: 180px !important; overflow: hidden !important; }' +
        'body.double-column .c-img-radius-large { max-height: 180px !important; overflow: hidden !important; border-radius: 8px !important; }' +

        'body.double-column .c-gap-top-small, body.double-column .c-gap-bottom-small { margin-top: 8px !important; margin-bottom: 8px !important; }' +
        'body.double-column ul, body.double-column ol { max-height: 150px !important; overflow: hidden !important; }' +

        'body.double-column .tag-wrapper_1sGop, body.double-column .tag-container_ksKXH { width: 100% !important; grid-column: 1 / -1 !important; }' +
        'body.double-column .c-showurl, body.double-column .c-tools { margin-top: auto !important; padding-top: 10px !important; flex-shrink: 0 !important; }' +

        'body.double-column .c-row, body.double-column [class*="flex"] { display: flex !important; flex-wrap: wrap !important; }' +
        'body.double-column .c-moreinfo, body.double-column .show-more { display: inline-block !important; color: #4e6ef2 !important; cursor: pointer !important; margin-top: 8px !important; }' +

        'body.single-column .rel-baike_2iWln .image-wrapper_39wYE, ' +
        'body.single-column .rel-baike_2iWln .c-img, ' +
        'body.single-column .lemma-item_1MZZu .c-img ' +
        '{ width: 60px !important; height: 60px !important; ' +
        'min-width: 60px !important; min-height: 60px !important; ' +
        'max-width: 60px !important; max-height: 60px !important; ' +
        'padding-bottom: 0 !important; position: relative !important; ' +
        'display: block !important; overflow: hidden !important; ' +
        'border-radius: 8px !important; }' +
        'body.single-column .rel-baike_2iWln .c-img img, ' +
        'body.single-column .lemma-item_1MZZu .c-img img ' +
        '{ position: static !important; width: 100% !important; height: 100% !important; ' +
        'max-width: 60px !important; max-height: 60px !important; ' +
        'object-fit: cover !important; display: block !important; }' +
        'body.single-column .lemma-item_1MZZu ' +
        '{ display: flex !important; flex-direction: row !important; ' +
        'align-items: flex-start !important; gap: 12px !important; ' +
        'padding: 12px 0 !important; min-height: 70px !important; }' +
        'body.single-column .lemma-item_1MZZu .c-span2 ' +
        '{ flex: 0 0 60px !important; width: 60px !important; ' +
        'max-width: 60px !important; margin: 0 !important; float: none !important; }' +
        'body.single-column .lemma-item_1MZZu .c-span10 ' +
        '{ flex: 1 !important; width: auto !important; ' +
        'min-width: 0 !important; float: none !important; }' +

        'body.double-column .rel-baike_2iWln .image-wrapper_39wYE, ' +
        'body.double-column .rel-baike_2iWln .c-img, ' +
        'body.double-column .lemma-item_1MZZu .c-img, ' +
        'body.double-column div[tpl="rel-baike"] .c-img, ' +
        'body.double-column div[tpl="rel-baike"] .image-wrapper_39wYE ' +
        '{ width: 60px !important; height: 60px !important; ' +
        'min-width: 60px !important; min-height: 60px !important; ' +
        'max-width: 60px !important; max-height: 60px !important; ' +
        'padding: 0 !important; padding-bottom: 0 !important; ' +
        'position: relative !important; display: block !important; ' +
        'overflow: hidden !important; border-radius: 8px !important; }' +
        'body.double-column .rel-baike_2iWln .c-img img, ' +
        'body.double-column .lemma-item_1MZZu .c-img img, ' +
        'body.double-column div[tpl="rel-baike"] .c-img img ' +
        '{ position: static !important; width: 100% !important; height: 100% !important; ' +
        'max-width: 60px !important; max-height: 60px !important; ' +
        'object-fit: cover !important; display: block !important; }' +
        'body.double-column .lemma-item_1MZZu, ' +
        'body.double-column div[tpl="rel-baike"] .lemma-item_1MZZu ' +
        '{ display: flex !important; flex-direction: row !important; ' +
        'align-items: flex-start !important; gap: 12px !important; ' +
        'padding: 12px 0 !important; min-height: 70px !important; }' +
        'body.double-column .lemma-item_1MZZu .c-span2, ' +
        'body.double-column div[tpl="rel-baike"] .c-span2 ' +
        '{ flex: 0 0 60px !important; width: 60px !important; ' +
        'max-width: 60px !important; margin: 0 12px 0 0 !important; ' +
        'float: none !important; }' +
        'body.double-column .lemma-item_1MZZu .c-span10, ' +
        'body.double-column div[tpl="rel-baike"] .c-span10 ' +
        '{ flex: 1 !important; width: auto !important; ' +
        'min-width: 0 !important; float: none !important; }' +

        'body.double-column #content_left > .result-op[tpl="rel-baike"], ' +
        'body.double-column #content_left > div[tpl="rel-baike"], ' +
        'body.double-column #content_left > .c-container[tpl="rel-baike"], ' +
        'body.double-column .result-op.c-container[tpl="rel-baike"], ' +
        'body.double-column div.c-group-wrapper[tpl="rel-baike"] ' +
        '{ width: calc(50% - 10px) !important; max-width: calc(50% - 10px) !important; ' +
        'min-width: calc(50% - 10px) !important; flex: 0 0 calc(50% - 10px) !important; ' +
        'flex-basis: calc(50% - 10px) !important; flex-grow: 0 !important; ' +
        'flex-shrink: 0 !important; margin: 0 !important; padding: 20px !important; ' +
        'box-sizing: border-box !important; }' +

        '@media (max-width: 1200px) { body.double-column #container.sam_newgrid, body.double-column #content_left { grid-template-columns: 1fr !important; } body.double-column .c-container, body.double-column .result-op, body.double-column .result { max-height: none !important; min-height: auto !important; } }' +
        '.c-container:hover, .result-op:hover, .result:hover { box-shadow: 0 6px 15px rgba(0,0,0,0.12) !important; transform: translateY(-3px) !important; }' +
        '#wrapper_wrapper, #container { max-width: 100% !important; padding: 0 !important; box-sizing: border-box !important; }' +
        '#content_right, #con-ar { display: none !important; }' +
        '.op_translation_textbg { background: none !important; }' +
        '.tag-wrapper_1sGop { display: flex !important; justify-content: center !important; width: 100% !important; max-width: 900px !important; margin: 0 auto !important; padding: 0 !important; }' +
        '.tag-scroll_3EMBO { display: flex !important; flex-wrap: wrap !important; justify-content: center !important; gap: 5px !important; max-width: 100% !important; }' +

        'body.double-column #rs, body.double-column #page { max-width: 1400px !important; margin: 20px auto !important; padding: 0 20px !important; box-sizing: border-box !important; }' +
        'body.double-column #rs > div, body.double-column #page > div { margin-left: 0 !important; margin-right: auto !important; }' +

        'body.double-column .c-span24 { width: 100% !important; max-width: 100% !important; float: none !important; }' +
        'body.double-column div[tpl="tieba_general"] .c-row { width: 100% !important; }' +
        'body.double-column div[tpl="tieba_general"] .c-span18 { width: 100% !important; max-width: none !important; }' +
        'body.double-column .op_tieba_general_main { width: 100% !important; }' +
        'body.double-column .op_exactqa_main, body.double-column .op_exactqa_body { width: 100% !important; }' +
        'body.double-column table { width: 100% !important; display: table !important; }' +
        'body.double-column .c-container > div, body.double-column .result-op > div { width: 100% !important; }' +
        'body.double-column .op-soft-title, body.double-column .op_soft_title { max-width: 100% !important; }' +
        'body.double-column [class*="open-source-software-blog-card"] section, ' +
        'body.double-column [class*="open-source-software-blog-card"] .blog-list-container, ' +
        'body.double-column [class*="open-source-software-blog-card"] .c-row { width: 100% !important; max-width: 100% !important; display: flex !important; }' +
        'body.double-column [class*="blog-summary"] { max-width: 100% !important; white-space: normal !important; }' +

        '.pc-fresh-wrapper-con .new-pmd .c-row.card-normal_3X7DX, .bk_polysemy_1Ef6j .c-row.card-normal_3X7DX { display: flex !important; flex-direction: row !important; align-items: flex-start !important; gap: 15px !important; flex-wrap: nowrap !important; }' +
        '.pc-fresh-wrapper-con .new-pmd .c-span3.left-image_3TJlK, .bk_polysemy_1Ef6j .c-span3.left-image_3TJlK { flex: 0 0 120px !important; width: 120px !important; max-width: 120px !important; }' +
        '.pc-fresh-wrapper-con .new-pmd .c-span9.main-info_4Q_kj, .bk_polysemy_1Ef6j .c-span9.main-info_4Q_kj { flex: 1 !important; min-width: 0 !important; display: flex !important; flex-direction: column !important; }' +

        '.pc-fresh-wrapper-con .source_1Vdff, .bk_polysemy_1Ef6j .source_1Vdff { display: flex !important; flex-direction: row !important; align-items: center !important; flex-wrap: nowrap !important; justify-content: flex-start !important; width: 100% !important; white-space: nowrap !important; margin-top: 10px !important; }' +
        '.pc-fresh-wrapper-con .siteLink_9TPP3, .bk_polysemy_1Ef6j .siteLink_9TPP3 { flex-shrink: 0 !important; margin-right: 15px !important; display: flex !important; align-items: center !important; }' +
        '.pc-fresh-wrapper-con .tts-wrapper_1Lt-9, .bk_polysemy_1Ef6j .tts-wrapper_1Lt-9, div[class*="tts-wrapper"] { display: flex !important; flex-direction: row !important; align-items: center !important; margin-right: auto !important; flex-shrink: 0 !important; }' +
        'div[class*="tts-wrapper"] > div, div[class*="tts-wrapper"] .voice-btn { display: inline-flex !important; align-items: center !important; margin-right: 10px !important; }' +
        '.pc-fresh-wrapper-con .c-tools, .bk_polysemy_1Ef6j .c-tools { margin-left: auto !important; flex-shrink: 0 !important; display: flex !important; align-items: center !important; position: static !important; }' +
        'body.double-column .bk_polysemy_1Ef6j .video-wrapper_MQNVE { width: 10% !important; height: 16px !important; margin-bottom: 8px !important; position: relative !important; border: 1px solid rgba(0, 0, 0, 0.05) !important; border-radius: 12px !important; overflow: hidden !important; -webkit-mask-image: -webkit-radial-gradient(white, black) !important; }' +

        'body.double-column .pc-fresh-wrapper-con .new-pmd .c-img-s { padding-bottom: 10% !important; }' +
        'body.double-column .pc-fresh-wrapper-con .new-pmd .c-img img { width: 100% !important; }' +
        'body.double-column .c-span3 { width: 25% !important; float: left !important; }' +
        'body.double-column .c-span9 { width: 75% !important; float: right !important; }' +

        'body.double-column div[class*="site-img"], body.double-column div[class*="site-img"] * { width: 16px !important; height: 16px !important; max-width: 16px !important; min-width: 16px !important; flex: 0 0 16px !important; box-sizing: border-box !important; }' +
        'body.double-column div[class*="site-img"] { margin-right: 6px !important; overflow: hidden !important; display: flex !important; align-items: center !important; }' +
        'body.double-column div[class*="site-img"] img { object-fit: contain !important; display: block !important; border: none !important; }' +
        'body.double-column .c-img-s, body.double-column .c-img-s * { width: 16px !important; height: 16px !important; max-width: 16px !important; }' +
        'body.double-column a[class*="siteLink"] { display: flex !important; align-items: center !important; text-decoration: none !important; }' +

        'body.double-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span3 .c-img-s { padding-bottom: 0 !important; }' +
        'body.single-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span3 .c-img-s { padding-bottom: 0 !important; }' +
        'body.double-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span3 .c-img-s { width: 120px !important; height: 100px !important; min-width: 120px !important; max-width: 120px !important; min-height: 100px !important; max-height: 100px !important; padding: 0 !important; overflow: hidden !important; flex-shrink: 0 !important; display: block !important; float: left !important; margin-right: 15px !important; }' +
        'body.single-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span3 .c-img-s { width: 120px !important; height: 100px !important; min-width: 120px !important; max-width: 120px !important; min-height: 100px !important; max-height: 100px !important; padding: 0 !important; overflow: hidden !important; flex-shrink: 0 !important; display: block !important; float: left !important; margin-right: 15px !important; }' +
        '.pc-fresh-wrapper-con .new-pmd .c-row > .c-span3 .c-img-s { width: 120px !important; height: 100px !important; min-width: 120px !important; max-width: 120px !important; min-height: 100px !important; max-height: 100px !important; padding: 0 !important; overflow: hidden !important; flex-shrink: 0 !important; display: block !important; float: left !important; margin-right: 15px !important; }' +
        'body.double-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span3 .c-img-s img { width: 100% !important; height: 100% !important; max-width: 120px !important; max-height: 100px !important; object-fit: cover !important; display: block !important; position: static !important; }' +
        'body.single-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span3 .c-img-s img { width: 100% !important; height: 100% !important; max-width: 120px !important; max-height: 100px !important; object-fit: cover !important; display: block !important; position: static !important; }' +
        '.pc-fresh-wrapper-con .new-pmd .c-row > .c-span3 .c-img-s img { width: 100% !important; height: 100% !important; max-width: 120px !important; max-height: 100px !important; object-fit: cover !important; display: block !important; position: static !important; }' +

        'body.double-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span9 .c-img3 { width: 140px !important; height: 100px !important; min-width: 140px !important; max-width: 140px !important; min-height: 100px !important; max-height: 100px !important; padding: 0 !important; overflow: hidden !important; flex-shrink: 0 !important; display: block !important; float: right !important; margin-left: 15px !important; }' +
        'body.single-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span9 .c-img3 { width: 140px !important; height: 100px !important; min-width: 140px !important; max-width: 140px !important; min-height: 100px !important; max-height: 100px !important; padding: 0 !important; overflow: hidden !important; flex-shrink: 0 !important; display: block !important; float: right !important; margin-left: 15px !important; }' +
        '.pc-fresh-wrapper-con .new-pmd .c-row > .c-span9 .c-img3 { width: 140px !important; height: 100px !important; min-width: 140px !important; max-width: 140px !important; min-height: 100px !important; max-height: 100px !important; padding: 0 !important; overflow: hidden !important; flex-shrink: 0 !important; display: block !important; float: right !important; margin-left: 15px !important; }' +
        'body.double-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span9 .c-img3 img { width: 100% !important; height: 100% !important; max-width: 140px !important; max-height: 100px !important; object-fit: cover !important; display: block !important; position: static !important; }' +
        'body.single-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span9 .c-img3 img { width: 100% !important; height: 100% !important; max-width: 140px !important; max-height: 100px !important; object-fit: cover !important; display: block !important; position: static !important; }' +
        '.pc-fresh-wrapper-con .new-pmd .c-row > .c-span9 .c-img3 img { width: 100% !important; height: 100% !important; max-width: 140px !important; max-height: 100px !important; object-fit: cover !important; display: block !important; position: static !important; }' +

        'body.double-column .pc-fresh-wrapper-con .new-pmd .c-span3 { width: auto !important; min-height: 110px !important; overflow: visible !important; margin-bottom: 15px !important; }' +
        'body.double-column .pc-fresh-wrapper-con .new-pmd .c-span9 { width: auto !important; min-height: 110px !important; overflow: visible !important; clear: none !important; }' +
        'body.single-column .pc-fresh-wrapper-con .new-pmd .c-span3 { width: auto !important; min-height: 110px !important; overflow: visible !important; margin-bottom: 15px !important; }' +
        'body.single-column .pc-fresh-wrapper-con .new-pmd .c-span9 { width: auto !important; min-height: 110px !important; overflow: visible !important; clear: none !important; }' +
        'body.double-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span3 > .c-span-last { display: block !important; margin-left: 135px !important; min-height: 100px !important; }' +
        'body.double-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span9.main-info_4Q_kj { display: block !important; min-height: 100px !important; }' +
        'body.single-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span3 > .c-span-last { display: block !important; margin-left: 135px !important; min-height: 100px !important; }' +
        'body.single-column .pc-fresh-wrapper-con .new-pmd .c-row > .c-span9.main-info_4Q_kj { display: block !important; min-height: 100px !important; }' +

        'body.double-column .pc-fresh-wrapper-con .source_1Vdff .site-img_aJqZX .c-img-s, body.double-column .pc-fresh-wrapper-con .source_1Vdff .site-img_aJqZX .c-img-s * { width: 16px !important; height: 16px !important; max-width: 16px !important; max-height: 16px !important; min-width: 16px !important; min-height: 16px !important; padding: 0 !important; margin: 0 !important; }' +
        'body.single-column .pc-fresh-wrapper-con .source_1Vdff .site-img_aJqZX .c-img-s, body.single-column .pc-fresh-wrapper-con .source_1Vdff .site-img_aJqZX .c-img-s * { width: 16px !important; height: 16px !important; max-width: 16px !important; max-height: 16px !important; min-width: 16px !important; min-height: 16px !important; padding: 0 !important; margin: 0 !important; }' +
        '.pc-fresh-wrapper-con .source_1Vdff .site-img_aJqZX .c-img-s, .pc-fresh-wrapper-con .source_1Vdff .site-img_aJqZX .c-img-s * { width: 16px !important; height: 16px !important; max-width: 16px !important; max-height: 16px !important; min-width: 16px !important; min-height: 16px !important; padding: 0 !important; margin: 0 !important; }' +

        'body.double-column .c-container:not(.pc-fresh-wrapper-con):not(.pc-fresh-wrapper-ext) div[class*="site-img"] .c-img-s { width: 16px !important; height: 16px !important; max-width: 16px !important; max-height: 16px !important; min-width: 16px !important; min-height: 16px !important; }' +
        'body.double-column .c-container:not(.pc-fresh-wrapper-con):not(.pc-fresh-wrapper-ext) div[class*="site-img"] .c-img-s img { width: 16px !important; height: 16px !important; max-width: 16px !important; max-height: 16px !important; }' +

        'div[tpl="rel-baike"] .lemma-item_1MZZu, .rel-baike_2iWln .lemma-item_1MZZu { display: flex !important; flex-direction: row !important; align-items: flex-start !important; height: auto !important; min-height: 80px !important; padding: 12px 0 !important; }' +
        'div[tpl="rel-baike"] .c-span2, .rel-baike_2iWln .c-span2 { width: 66px !important; flex: 0 0 66px !important; max-width: 66px !important; margin: 0 12px 0 0 !important; float: none !important; }' +
        'div[tpl="rel-baike"] .c-img, div[tpl="rel-baike"] .image-wrapper_39wYE, .rel-baike_2iWln .c-img { width: 60px !important; height: 60px !important; padding-bottom: 0 !important; position: relative !important; display: block !important; overflow: hidden !important; }' +
        'div[tpl="rel-baike"] .c-img img, .rel-baike_2iWln .c-img img { position: static !important; width: 100% !important; height: 100% !important; max-width: 60px !important; max-height: 60px !important; object-fit: cover !important; border-radius: 8px !important; }' +
        'div[tpl="rel-baike"] .c-span10, .rel-baike_2iWln .c-span10 { flex: 1 !important; width: auto !important; max-width: none !important; float: none !important; padding: 0 !important; }' +
        'body.dark-mode .rel-baike_2iWln .c-img, body.dark-mode .rel-baike_2iWln .c-img-border { background: transparent !important; border: none !important; }' +

        'body.dark-mode div[class*="gameinfo"] [class*="common-font"], body.dark-mode div[class*="gameinfo"] [class*="common-font"] span, ' +
        'body.dark-mode [class*="platform-intro_"], body.dark-mode [class*="item-name_"], body.dark-mode [class*="item-sort_"], ' +
        'body.dark-mode [class*="btn-text_"], body.dark-mode [class*="container-text_"] ' +
        '{ color: #e8e6e3 !important; text-shadow: 0 0 2px rgba(0,0,0,0.5) !important; }' +
        'body.dark-mode [class*="platform-tags_"] a, body.dark-mode [class*="viewlink_"] ' +
        '{ color: #8ab4f8 !important; text-shadow: none !important; background: transparent !important; }' +
        'body.dark-mode [class*="container-source_"] { color: #999 !important; text-shadow: none !important; }' +
        'body.dark-mode .c-tabs-nav-li { color: #ccc !important; }' +
        'body.dark-mode .c-tabs-nav-li[class*="selected"] { color: #fff !important; border-bottom-color: #4e6ef2 !important; }' +

        '#content_left > .c-container:first-child, #content_left > .result:first-child, #content_left > .result-op:first-child { position: relative !important; padding-bottom: 35px !important; }' +
        'body.double-column .k8vt8hp { display: none !important; }' +

        '.c-container[tpl="baike"], .c-container[tpl="kg_entity_card"], .c-container.pc-fresh-wrapper-con, .c-container.c-group-wrapper { display: block !important; height: auto !important; max-height: none !important; width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; overflow: visible !important; }' +
        '.pc-fresh-wrapper-con .source_1Vdff, .c-group-wrapper .source_1Vdff { position: relative !important; clear: both !important; margin-top: 15px !important; padding-top: 10px !important; display: flex !important; align-items: center !important; flex-wrap: nowrap !important; width: 100% !important; height: auto !important; }' +
        '.c-container[tpl="baike"]::after, .pc-fresh-wrapper-con::after { content: " " !important; display: table !important; clear: both !important; }' +

        // ==========================================
        // ⚡ 百度热搜榜
        // ==========================================
        'body.pc-fresh-wrapper-con .c-pc-toppic-card, body .c-pc-toppic-card, body .boiling-all_29kBD { min-width: 0 !important; min-width: unset !important; }' +
        '.gm-hot-search { position: relative !important; height: auto !important; max-height: none !important; box-sizing: border-box !important; overflow: hidden !important; border-radius: 12px !important; padding: 0 !important; min-width: 0 !important; }' +
        '.gm-hot-search .bg-wrapper_2Yb28 { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; z-index: 0 !important; }' +
        '.gm-hot-search .bg-wrapper_2Yb28 img { width: 100% !important; height: 100% !important; object-fit: cover !important; }' +
        '.gm-hot-search .boiling-wrapper_fhywn, .boiling-all_29kBD .boiling-wrapper_fhywn { position: relative !important; top: 0 !important; height: auto !important; max-height: none !important; width: 100% !important; padding: 20px !important; box-sizing: border-box !important; }' +
        '.gm-hot-search .boiling-contain_3r2Lv { width: 100% !important; max-width: 100% !important; margin: 0 !important; min-width: 0 !important; }' +
        'body .gm-hot-search, body .c-pc-toppic-card { width: auto !important; max-width: none !important; }' +

        'body.single-column #content_left > .result-op[tpl="boiling-point"], ' +
        'body.single-column #content_left > .c-container[tpl="boiling-point"], ' +
        'body.single-column .gm-hot-search, ' +
        'body.single-column .c-pc-toppic-card { ' +
        'width: 100% !important; max-width: 800px !important; margin: 0 auto 25px auto !important; ' +
        '}' +

        'body.double-column #content_left > .result-op[tpl="boiling-point"], ' +
        'body.double-column #content_left > .c-container[tpl="boiling-point"], ' +
        'body.double-column .gm-hot-search, ' +
        'body.double-column .c-pc-toppic-card { ' +
        '    width: 100% !important; max-width: 100% !important; ' +
        '    flex: 0 0 100% !important; margin: 0 0 20px 0 !important; ' +
        '    box-sizing: border-box !important; overflow: hidden !important; ' +
        '}' +

        'body.double-column #content_left > .result-op:first-child[tpl="boiling-point"], ' +
        'body.double-column #content_left > .c-container:first-child[tpl="boiling-point"] { ' +
        '    width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; ' +
        '}' +

        // 核心滚动
        '.gm-hot-search .boiling-hot-list_3MLaq { ' +
        '    width: 100% !important; position: relative !important; overflow-x: auto !important; ' +
        '    overflow-y: hidden !important; scrollbar-width: thin; padding-bottom: 12px !important; ' +
        '    display: block !important; ' +
        '}' +
        '.gm-hot-search .no-swiper-area_52LRg, .gm-hot-search .swiper-wrapper { ' +
        '    display: flex !important; flex-wrap: nowrap !important; width: 100% !important; ' +
        '    min-width: max-content !important; justify-content: flex-start !important; gap: 15px !important; ' +
        '    transform: none !important; transition: none !important; margin: 0 !important; ' +
        '}' +
        '.gm-hot-search .card_1FDsA { ' +
        '    flex: 1 !important; min-width: 240px !important; max-width: 350px !important; ' +
        '    height: auto !important; margin: 0 !important; padding: 12px !important; ' +
        '    box-sizing: border-box !important; border-radius: 8px !important; box-shadow: none !important; ' +
        '    background-color: rgba(255,255,255,0.1) !important; border: 1px solid rgba(255,255,255,0.2) !important; ' +
        '}' +

        '.gm-hot-search .hot-item_1473U { display: flex !important; width: 100% !important; margin-bottom: 8px !important; align-items: center !important; }' +
        '.gm-hot-search .item-mid_vrw25 { flex: 1 !important; min-width: 0 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }' +
        '.gm-hot-search .hot-score_2DajL { display: none !important; }' +
        '.gm-hot-search .mid-img_3-88C { display: flex !important; width: 100% !important; margin-bottom: 15px !important; justify-content: center !important; }' +
        '.gm-hot-search .boiling-title_ZrdUH img { max-width: 180px !important; height: auto !important; object-fit: contain !important; }' +
        '.gm-hot-search .row-right_1eYkS, .gm-hot-search .boiling-right_3Etl4 { display: none !important; }' +
        '.boiling-hot-list_3MLaq::-webkit-scrollbar { height: 8px !important; }' +
        '.boiling-hot-list_3MLaq::-webkit-scrollbar-track { background: transparent !important; }' +
        '.boiling-hot-list_3MLaq::-webkit-scrollbar-thumb { background: #d0d0d0 !important; border-radius: 4px !important; }' +

        '.gm-hot-search .boiling-contain_3r2Lv .row-left_1OGNu, .boiling-all_29kBD .row-left_1OGNu { padding-top: 2px !important; overflow: hidden !important; flex: 1 !important; min-width: 0 !important; }' +
        '.gm-hot-search .boiling-contain_3r2Lv .mid-img_3-88C, .boiling-all_29kBD .mid-img_3-88C { position: relative !important; height: 50px !important; display: flex !important; width: 100% !important; margin-bottom: 15px !important; justify-content: center !important; }' +
        'body:not(.dark-mode) .gm-hot-search .title-text_16Vh- { color: #fff !important; }' +
        'body:not(.dark-mode) .gm-hot-search .item-mid_vrw25 { color: #fff !important; }' +
        'body.dark-mode .gm-hot-search .bg-wrapper_2Yb28 { display: none !important; }' +
        'body.dark-mode .gm-hot-search { background-color: #252525 !important; border: 1px solid #333 !important; }' +
        'body.dark-mode .gm-hot-search .card_1FDsA { background-color: #333 !important; border: 1px solid #444 !important; }' +
        'body.dark-mode .gm-hot-search .boiling-title_ZrdUH img { filter: brightness(0) invert(1) opacity(0.8) !important; }' +
        'body.dark-mode .gm-hot-search .title-text_16Vh-, body.dark-mode .gm-hot-search .item-mid_vrw25 { color: #e8e6e3 !important; text-shadow: none !important; }' +
        'body.dark-mode .gm-hot-search .hot-item_1473U:hover .item-mid_vrw25 { color: #8ab4f8 !important; text-decoration: underline !important; }' +
        'body.dark-mode .gm-hot-search .item-left_21sbZ:not([class*="num-color"]) { color: #888 !important; }' +
        'body.dark-mode .gm-hot-search .more-text_3Oa53 span, body.dark-mode .gm-hot-search .more-text_3Oa53 i { color: #777 !important; }' +
        'body.dark-mode .boiling-hot-list_3MLaq::-webkit-scrollbar-thumb { background: #555 !important; }' +
        'body.dark-mode .boiling-hot-list_3MLaq::-webkit-scrollbar-thumb:hover { background: #777 !important; }';

    const runModifications = () => {
        try {
            if (window.location.host === 'm.baidu.com') {
                processRedirects();
                if (document.body) {
                    document.body.style.opacity = '1';
                }
                return;
            }

            if (window.location.pathname === '/' || (window.location.pathname === '/index.php' && !window.location.search.includes('wd'))) {
                const homepageStyles =
                    '#form, #s_form, .s_btn_wr, .s_ipt_wr, .fm, .ai-input, .s-center-box, #s_new_search_guide, #bottom_layer, #bottom_space, #s_popup_advert, .popup-advert, .advert-shrink { display: none !important; }' +
                    '#lg { ' +
                    '    display: flex !important; ' +
                    '    justify-content: center !important; ' +
                    '    align-items: center !important; ' +
                    '    margin-top: 5vh !important; ' +
                    '    padding-top: 0 !important; ' +
                    '    height: 190px !important; ' +
                    '    opacity: 1 !important; ' +
                    '    visibility: visible !important; ' +
                    '    position: relative !important; ' +
                    '}' +
                    '#lg img { ' +
                    '    filter: none !important; ' +
                    '    width: 270px !important; ' +
                    '    height: 129px !important; ' +
                    '}' +
                    'body.dark-mode #lg img { filter: invert(0.9) hue-rotate(180deg) !important; }' +
                    '.gm-search-container { ' +
                    '    position: relative !important; ' +
                    '    top: 0px !important; ' +
                    '    left: 0 !important; ' +
                    '    transform: none !important; ' +
                    '    display: flex !important; ' +
                    '    justify-content: center !important; ' +
                    '    margin: 0 auto !important; ' +
                    '    z-index: 10; ' +
                    '}';

                GM_addStyle(commonStyles + homepageStyles);

                if (!document.querySelector('.gm-search-container')) {
                    const logo = document.getElementById('lg');
                    if (logo) {
                        logo.insertAdjacentHTML('afterend', customSearchBoxHTML);
                    } else {
                        document.body.insertAdjacentHTML('beforeend', customSearchBoxHTML);
                    }
                    document.querySelector('.gm-search-input')?.focus();
                    attachEventListeners();
                }
            } else if (window.location.pathname === '/s') {
                const resultsPageStyles =
                    '.EC_result, .ec_result, [data-tuiguang], [data-ecimtimesign], [data-placeid], [data-cmatchid], .ec-tuiguang, .c-recomm-wrap, ' +
                    '#content_left > div[style*="display:block !important"], #content_left > div[data-ec-ad-type], #s_popup_advert { display: none !important; }' +
                    '#s_popup_advert, .popup-advert, .advert-shrink, .advert-shrink2, #s_popup_advert * { display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; opacity: 0 !important; pointer-events: none !important; position: fixed !important; top: -9999px !important; left: -9999px !important; z-index: -999999 !important; clip: rect(0 0 0 0) !important; }' +
                    'body.hide-ai div[tpl="new_baikan_index"], body.hide-ai [tpl="wenda_generate"], body.hide-ai .ai-entry.cos-space-mb-xs, body.hide-ai .result-op.c-container.new-pmd[tpl="ai_index"], body.hide-ai .result-op[tpl="wenda_generate"], body.hide-ai div[m-name^="mirror-san/app/wenda_generate"], body.hide-ai div[tpl="ai_ask"] { display: none !important; }' +
                    '#s_form, #u { display: none !important; }' +
                    '#head { height: 60px !important; display: flex; align-items: center; justify-content: center; background: #fff !important; border-bottom: 1px solid #e4e7ed !important; transition: background-color 0.3s, border-color 0.3s; }' +
                    '#container { padding-top: 10px !important; }' +
                    '#s_tab { width: 100% !important; padding-left: 0 !important; display: flex !important; justify-content: center !important; background: transparent !important; }' +
                    '#s_tab_inner { display: flex !important; align-items: center !important; justify-content: center !important; width: auto !important; float: none !important; }' +
                    '#s_tab .s-tab-item { display: inline-flex !important; align-items: center !important; float: none !important; margin: 0 10px !important; vertical-align: middle !important; }' +
                    '#s_tab .s-tab-item img { height: 16px !important; width: auto !important; margin-right: 5px !important; vertical-align: text-bottom !important; object-fit: contain !important; }' +
                    '.tag-container_ksKXH, .wrapper_l .tag-wrapper_1sGop { width: 100% !important; margin: 10px auto !important; position: relative !important; display: flex !important; justify-content: center !important; top: unset !important; bottom: unset !important; float: none !important; }' +
                    '.tag-scroll_3EMBO { display: flex !important; justify-content: center !important; width: auto !important; }' +

                    '.gm-search-container { display: flex; margin: 0 auto; justify-content: center; }' +
                    '.gm-control-button { position: fixed; bottom: 20px; width: 48px; height: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 10000; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35); transition: all 0.3s cubic-bezier(.25,.8,.25,1) !important; overflow: hidden; }' +
                    '.gm-control-button::before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%); opacity: 0; transition: opacity 0.3s ease; }' +
                    '.gm-control-button:hover { transform: scale(1.1) rotate(5deg); box-shadow: 0 6px 18px rgba(102, 126, 234, 0.5); }' +
                    '.gm-control-button:hover::before { opacity: 1; }' +
                    '.gm-control-button:active { transform: scale(1.02); box-shadow: 0 3px 10px rgba(102, 126, 234, 0.4); }' +
                    '#settings-toggle { left: 20px; }' +
                    '.settings-icon { width: 22px; height: 22px; transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)); }' +
                    '.settings-icon svg { width: 100%; height: 100%; fill: #ffffff; }' +
                    '#settings-toggle:hover .settings-icon { transform: rotate(120deg) scale(1.08); }' +
                    '#back-to-top { right: 20px; opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(.25,.8,.25,1) !important; }' +
                    '#back-to-top.show { opacity: 1; visibility: visible; }' +
                    '.back-to-top-icon { width: 22px; height: 22px; transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)); }' +
                    '.back-to-top-icon svg { width: 100%; height: 100%; fill: #ffffff; }' +
                    '#back-to-top:hover .back-to-top-icon { transform: translateY(-4px) scale(1.08); animation: bounce 0.6s ease-in-out infinite; }' +
                    '@keyframes bounce { 0%, 100% { transform: translateY(-4px) scale(1.08); } 50% { transform: translateY(-6px) scale(1.08); } }' +
                    '#settings-panel { position: fixed; bottom: 76px; left: 20px; background: #fff; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.15); padding: 10px; z-index: 10001; opacity: 0; visibility: hidden; transform: translateY(15px) scale(0.9); transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); min-width: 160px; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); }' +
                    '#settings-panel::before { content: ""; position: absolute; top: -6px; left: 18px; width: 12px; height: 12px; background: #fff; transform: rotate(45deg); border-left: 1px solid rgba(0,0,0,0.05); border-top: 1px solid rgba(0,0,0,0.05); }' +
                    '#settings-panel.show { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }' +
                    '.settings-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; position: relative; overflow: hidden; }' +
                    '.settings-item::before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%); opacity: 0; transition: opacity 0.25s ease; }' +
                    '.settings-item:hover { background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%); transform: translateX(2px); }' +
                    '.settings-item:hover::before { opacity: 1; }' +
                    '.settings-item-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #202124; font-weight: 500; z-index: 1; }' +
                    '.settings-item-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; transition: transform 0.25s ease; }' +
                    '.settings-item:hover .settings-item-icon { transform: scale(1.1) rotate(5deg); }' +
                    '.settings-item-icon svg { width: 100%; height: 100%; }' +
                    '.toggle-switch { position: relative; width: 38px; height: 22px; background: #dadce0; border-radius: 11px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); flex-shrink: 0; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); }' +
                    '.toggle-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); border-radius: 50%; transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }' +
                    '.toggle-switch.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow: inset 0 1px 3px rgba(0,0,0,0.15), 0 0 12px rgba(102, 126, 234, 0.35); }' +
                    '.toggle-switch.active::after { transform: translateX(16px); box-shadow: 0 2px 6px rgba(0,0,0,0.3); }' +
                    '.settings-divider { height: 1px; background: linear-gradient(90deg, transparent 0%, #e8eaed 50%, transparent 100%); margin: 6px 0; }' +
                    '.icon-dark-mode { width: 16px; height: 16px; }' +
                    '.icon-dark-mode svg { fill: #5f6368; transition: fill 0.25s ease; }' +
                    '.settings-item:hover .icon-dark-mode svg { fill: #667eea; }' +
                    '.icon-layout { width: 16px; height: 16px; }' +
                    '.icon-layout svg { fill: #5f6368; stroke: #5f6368; transition: all 0.25s ease; }' +
                    '.settings-item:hover .icon-layout svg { fill: #667eea; stroke: #667eea; }' +
                    '.icon-ai { width: 16px; height: 16px; }' +
                    '.icon-ai svg { fill: #5f6368; transition: fill 0.25s ease; }' +
                    '.settings-item:hover .icon-ai svg { fill: #667eea; }' +
                    '.icon-auto-page { width: 16px; height: 16px; }' +
                    '.icon-auto-page svg { fill: #5f6368; transition: fill 0.25s ease; }' +
                    '.settings-item:hover .icon-auto-page svg { fill: #667eea; }' +
                    '.gm-auto-page-indicator { position: fixed !important; bottom: 80px !important; left: 50% !important; transform: translateX(-50%) !important; background: rgba(102, 126, 234, 0.95) !important; color: white !important; padding: 10px 20px !important; border-radius: 20px !important; font-size: 14px !important; z-index: 9999 !important; display: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important; }' +

                    'body.dark-mode .gm-control-button { background-color: #3c4043; }' +
                    'body.dark-mode .gm-control-button:hover { background-color: #4d5154; }' +
                    'body.dark-mode .settings-icon svg { fill: #e8eaed; }' +
                    'body.dark-mode #settings-panel { background: #292a2d; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }' +
                    'body.dark-mode .settings-item { color: #e8eaed; }' +
                    'body.dark-mode .settings-item:hover { background: #3c4043; }' +
                    'body.dark-mode .settings-item-label { color: #e8eaed; }' +
                    'body.dark-mode .settings-divider { background: #3c4043; }' +
                    'body.dark-mode .icon-dark-mode svg, body.dark-mode .icon-layout svg, body.dark-mode .icon-ai svg { fill: #e8eaed; stroke: #e8eaed; }' +
                    'body.dark-mode .toggle-switch { background: #5f6368; }' +
                    'body.dark-mode.double-column #rs, body.dark-mode.double-column #page { background: transparent !important; }' +
                    'body.dark-mode.double-column .rs-title { color: #e8e6e3 !important; }' +
                    'body.dark-mode.double-column .rs-list .rs-item a { color: #8ab4f8 !important; background: #3c4043 !important; border: 1px solid #555 !important; border-radius: 4px !important; padding: 4px 12px !important; text-decoration: none !important; }' +
                    'body.dark-mode.double-column .rs-list .rs-item a:hover { background: #4e6ef2 !important; color: #fff !important; }' +
                    'body.dark-mode.double-column #page a { background: #3c4043 !important; border: 1px solid #555 !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode.double-column #page a:hover { background: #4e6ef2 !important; color: #fff !important; }' +
                    'body.dark-mode #back-to-top .btt-icon svg { fill: #e8eaed; }' +

                    'body.dark-mode { background-color: #1a1a1a !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode #head { background: #252525 !important; border-bottom: 1px solid #333 !important; }' +
                    'body.dark-mode .gm-search-input { background: #333; border-color: #555 !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode .c-container, body.dark-mode .result-op, body.dark-mode .result[tpl="soft"], body.dark-mode div[class*="_aladdin"] { background-color: #252525 !important; border: 1px solid #333 !important; border-radius: 8px; padding: 15px; }' +
                    'body.dark-mode .c-container > .t.c-title, body.dark-mode .tags_2yHYj, body.dark-mode .cos-tabs.cos-tabs-bar .cos-tabs-header, body.dark-mode .tag-container_ksKXH, body.dark-mode .wrapper_l .tag-wrapper_1sGop { background-color: transparent !important; }' +
                    'body.dark-mode #content_left a, body.dark-mode #content_left h3[class*="title"], body.dark-mode #content_left h3[class*="title"] *, body.dark-mode #content_left .op-soft-title, body.dark-mode #content_left .op-soft-title *, body.dark-mode .tag-container_ksKXH a, body.dark-mode .wrapper_l .tag-wrapper_1sGop a { color: #8ab4f8 !important; text-decoration: none !important; background-color: transparent !important; text-shadow: 0 0 2px rgba(0,0,0,0.5) !important; }' +
                    'body.dark-mode #content_left a:hover { text-decoration: underline !important; }' +
                    'body.dark-mode .c-abstract, body.dark-mode .c-abstract *, body.dark-mode .c-span-last, body.dark-mode .summary-text_560AW, body.dark-mode .summary-text_560AW *, body.dark-mode #content_left em, body.dark-mode .new-pmd .c-color-text, body.dark-mode .cu-color-text, body.dark-mode .content-summary_2vT1Z .summary_7f0uR, body.dark-mode .cos-text-body, body.dark-mode .orientation-title-wrapper_YgpKw .orientation-title_50ct8, body.dark-mode .pc_5KjyO .text_4wMIj, body.dark-mode .pc_ZVQ8P .title_6sD3p, body.dark-mode ._group-title_klgk1_34 { color: #e8e6e3 !important; text-shadow: 0 0 2px rgba(0,0,0,0.5) !important; }' +
                    'body.dark-mode #content_left em { font-style: italic !important; }' +
                    'body.dark-mode .op-soft-info-text, body.dark-mode .c-showurl, body.dark-mode .c-showurl *, body.dark-mode .cosc-source-text, body.dark-mode .cos-color-text-minor, body.dark-mode .op_translation_usertip, body.dark-mode .fy-dictwisenew-tip_79GW0, body.dark-mode .cos-color-text-tiny, body.dark-mode .stockStateContainer_bpzBK, body.dark-mode .phrase-text_1u3Zc, body.dark-mode .fy-dictwisenew-tip_1tVMp, body.dark-mode .cos-item-desc_7mnJc { color: #999 !important; text-shadow: none !important; }' +
                    'body.dark-mode div[class*="stock-container"] * { color: #e8e6e3 !important; background: none !important; background-color: transparent !important; text-shadow: 0 0 2px rgba(0,0,0,0.5) !important; }' +
                    'body.dark-mode div[class*="stock-container"] a { color: #8ab4f8 !important; }' +
                    'body.dark-mode .op-stock-nav-item-selected { background-color: #3a3a3a !important; border-radius: 4px !important; }' +
                    'body.dark-mode #s_tab a, body.dark-mode #s_tab span { color: #ccc !important; text-decoration: none !important; text-shadow: none !important; }' +
                    'body.dark-mode #s_tab .s-tab-item.current span { color: #fff !important; }' +
                    'body.dark-mode #s_tab .s-tab-item.current { border-bottom-color: #4e6ef2 !important; }' +
                    'body.dark-mode #page a, body.dark-mode #page strong { background-color: #333 !important; border: 1px solid #555 !important; color: #e8e3e3 !important; text-shadow: none !important; }' +
                    'body.dark-mode #page a, body.dark-mode #page strong { background-color: #333 !important; border: 1px solid #555 !important; color: #e8e3e3 !important; text-shadow: none !important; }' +
                    'body.dark-mode .leftArrow_ag-Qe, body.dark-mode .rightArrow_2RcSz { filter: invert(1) brightness(1.2) !important; }' +
                    'body.dark-mode #page a img { filter: invert(1) brightness(1.2) !important; }' +
                    '.pc-fresh-wrapper-con .new-pmd .c-img-radius-large, .pc-fresh-wrapper-con .c-img-radius-large, .new-pmd .c-img-radius-large, .c-img-radius-large.c-img-s { width: 80px !important; height: 66px !important; min-width: 80px !important; min-height: 66px !important; max-width: 80px !important; max-height: 66px !important; padding: 0 !important; padding-bottom: 0 !important; display: block !important; overflow: hidden !important; border-radius: 8px !important; }' +
                    '.pc-fresh-wrapper-con .new-pmd .c-img-radius-large img, .pc-fresh-wrapper-con .c-img-radius-large img, .new-pmd .c-img-radius-large img { width: 80px !important; height: 66px !important; min-width: 80px !important; min-height: 66px !important; max-width: 80px !important; max-height: 66px !important; object-fit: cover !important; position: static !important; display: block !important; }' +
                    'body.dark-mode #page strong, body.dark-mode #page a.n:hover { background-color: #4e6ef2 !important; color: #fff !important; border-color: #4e6ef2 !important; }' +
                    'body.dark-mode #dark-mode-toggle { background-color: #3c4043; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); }' +
                    'body.dark-mode #dark-mode-toggle:hover { background-color: #4d5154; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5); }' +
                    'body.dark-mode .dark-mode-icon-sun { opacity: 0; transform: scale(0.5) rotate(90deg); }' +
                    'body.dark-mode .dark-mode-icon-moon { opacity: 1; transform: scale(1) rotate(0deg); box-shadow: inset 8px -8px 0 0 #e8eaed; }' +
                    'body.dark-mode .text-con_6ko8Y *, body.dark-mode .common-content_6I4X7, body.dark-mode .common-content_6I4X7 *, body.dark-mode .common-text_4MwRe, body.dark-mode .bg_75N1H, body.dark-mode .marklang-paragraph, body.dark-mode .item-text_1uePL, body.dark-mode .detail-text_6bA6P, body.dark-mode .item-num_13Q8D, body.dark-mode .scroll-box_2RZdL .week-box_5twsY .week-item_4zjYh .value_1wQkq, body.dark-mode .pc-sub-title_eKXM1 { color: #e8e6e3 !important; text-shadow: 0 0 2px rgba(0,0,0,0.5) !important; }' +
                    'body.dark-mode .words-text_5Ps7D, body.dark-mode .words-text_5Ps7D span, body.dark-mode .cos-search-link-text, body.dark-mode .cos-icon-research, body.dark-mode .cos-more-link-text, body.dark-mode .cos-tabs-header .cos-tab, body.dark-mode .detail-underline_7dWH2, body.dark-mode .detail-icon_3mni6 i { color: #8ab4f8 !important; text-shadow: 0 0 2px rgba(0,0,0,0.5) !important; }' +
                    'body.dark-mode .common-text_2R17p.cos-font-medium, body.dark-mode object.cos-line-clamp-2 .mean-text_4MwRe { color: #e8e6e3 !important; text-shadow: 0 0 2px rgba(0,0,0,0.5) !important; }' +

                    'body.dark-mode .tabContainer_4bRe9 { background: transparent !important; border-bottom: 1px solid #444 !important; }' +
                    'body.dark-mode .tabItem_14YyZ span, body.dark-mode .tabItem_14YyZ .cos-icon { color: #999 !important; }' +
                    'body.dark-mode .tabItem_14YyZ.active_2sYvR span, body.dark-mode .tabItem_14YyZ.active_2sYvR .cos-icon { color: #fff !important; }' +
                    'body.dark-mode .tabItem_14YyZ.active_2sYvR { border-bottom: 2px solid #4e6ef2 !important; background-color: #3c4043 !important; border-radius: 6px !important; }' +
                    'body.dark-mode .item_uMLQg .number_7sHfk, body.dark-mode .item_uMLQg .desc_1V5he, body.dark-mode .item_uMLQg .red_e7rrn .number_7sHfk, body.dark-mode .item_uMLQg .red_e7rrn .desc_1V5he, body.dark-mode .item_uMLQg .selected_3I0vG .number_7sHfk, body.dark-mode .item_uMLQg .selected_3I0vG .desc_1V5he { color: #e8e6e3 !important; }' +
                    'body.dark-mode .item_uMLQg .selected_3I0vG { background-color: #3c4043 !important; border-radius: 8px; }' +
                    'body.dark-mode .jrStockColorCommon_5usgg, body.dark-mode .result-label_2twAL, body.dark-mode .result-content_4C7SO, body.dark-mode .cos-link span, body.dark-mode .cos-input-box, body.dark-mode .cos-input-box::placeholder, body.dark-mode .c-fwb.cu-font-bold { color: #e8e6e3 !important; text-shadow: 0 0 2px rgba(0,0,0,0.5) !important; }' +
                    '.cos-tabs.cos-tabs-bar .cos-tab { border-radius: var(--cos-rounded-sm) !important; box-sizing: border-box !important; }' +
                    '.new-pmd.c-container, .new-pmd .c-container { color: #333 !important; word-wrap: break-word !important; word-break: break-all !important; }' +
                    'body.dark-mode .new-pmd.c-container, body.dark-mode .new-pmd .c-container, body.dark-mode .new-pmd .c-color-t { color: #ddd !important; }' +
                    'body.dark-mode div[tpl="fy_sg_dictwisenew_san"] .cosc-card-content-border::after { border: none !important; }' +

                    'body.dark-mode .footer_3iz2Q { background-color: #252525 !important; padding: 16px !important; border-radius: 0 0 8px 8px !important; }' +
                    'body.dark-mode .content_2YLYk { background-color: #939090 !important; }' +
                    'body.dark-mode .more_4Wd1Y { background-color: #939090 !important; }' +
                    'body.dark-mode .more_4Wd1Y:hover { background-color: #4d5154 !important; }' +
                    'body.dark-mode .header_2JJaR { background-color: #252525 !important; padding: 8px !important; border-radius: 8px 8px 0 0 !important; }' +
                    'body.dark-mode ._select-entry_1svrl_48, body.dark-mode .header-btn_68kgy { background-color: #3c4043 !important; border: 1px solid #5f6368 !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode ._select-entry_1svrl_48 span, body.dark-mode ._select-entry_1svrl_48 i { color: #e8e6e3 !important; }' +
                    'body.dark-mode .calendar-prev-month_mlSD9, body.dark-mode .calendar-next-month_67Qbg { color: #e8e6e3 !important; }' +
                    'body.dark-mode ._bg-header_1ml43_46 { background: #252525 !important; }' +
                    'body.dark-mode ._horizontal-gradient_1ml43_56, body.dark-mode ._radial-gradient-box_1ml43_100, body.dark-mode ._border-layer_1ml43_64, body.dark-mode ._vertical-gradient_1ml43_197 { display: none !important; }' +
                    'body.dark-mode .date_1NCuX, body.dark-mode .left_1rsjT div, body.dark-mode .text_1aZG9, body.dark-mode .content_2YLYk > div:last-child, body.dark-mode .content_2YLYk .cos-icon { color: #0c0c0c !important; }' +
                    'body.dark-mode .tag_1vuJL.primary_6QEFO { background-color: #0c0c0c !important; color: #8ab4f8 !important; }' +
                    'body.dark-mode .tag_1vuJL.gray_4CByt { background-color: #0c0c0c !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode .divider_2iIet { border-bottom-color: #0c0c0c !important; }' +
                    'body.dark-mode .week_4Dpla .cos-col { color: #e8e6e3 !important; }' +
                    'body.dark-mode .week_4Dpla .cu-color-red { color: #ff8a80 !important; }' +
                    'body.dark-mode .sc-popup._popup_65wrg_1 { background-color: #3c4043 !important; border: 1px solid #5f6368 !important; }' +
                    'body.dark-mode ._selectItem_1svrl_23 { color: #e8e6e3 !important; }' +
                    'body.dark-mode ._selectItem_1svrl_23:hover { background-color: #4d5154 !important; }' +
                    'body.dark-mode ._selectItem_1svrl_23._selected_1svrl_14 { background-color: #4e6ef2 !important; color: #ffffff !important; }' +

                    'body.dark-mode .common-text_2R17p { color: #e8e6e3 !important; }' +
                    'body.dark-mode .common-content_6bdEK .cos-tag { background-color: #3c4043 !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode .orginal-bg_5BENF, body.dark-mode .orginal-bg_7DUYv { background-color: #3c4043 !important; border-radius: 6px !important; }' +
                    'body.dark-mode .orginal-tip_2KtVB, body.dark-mode .orginal-txt_3dDqw, body.dark-mode .orginal-tip_6LLO4, body.dark-mode .orginal-txt_7mXZW { color: #e8e6e3 !important; }' +
                    'body.dark-mode .orginal-bg_5BENF svg, body.dark-mode .audio-wrap_5VmPZ svg { fill: #e8e6e3 !important; }' +
                    'body.dark-mode .exam-tabs_rufRu .cos-tabs-header-container, body.dark-mode .exam-tabs_G4cbw .cos-tabs-header-container { background-color: #3c4043 !important; background-image: none !important; }' +
                    'body.dark-mode .exam-tabs_G4cbw .cos-tab { color: #ccc !important; }' +
                    'body.dark-mode .exam-tabs_G4cbw .cos-tab-active { color: #fff !important; background-color: #4d5154 !important; border-radius: 6px !important; }' +
                    'body.dark-mode .jindu_7EgZt { background-color: #555 !important; }' +
                    'body.dark-mode .jindu-light_1fvAY { background-color: #4e6ef2 !important; }' +
                    'body.dark-mode .num_57XJn { color: #ccc !important; }' +
                    'body.dark-mode .dict-link_tDRnr .part-name_4zPck, body.dark-mode .dict-link_tDRnr .mean-text_md00R { color: #e8e6e3 !important; }' +

                    'body.dark-mode .op_translation_lagfrom, body.dark-mode .op_translation_lagto { background-color: #3c4043 !important; border: 1px solid #5f6368 !important; box-shadow: 0 2px 10px 0 rgba(0,0,0,.3) !important; }' +
                    'body.dark-mode .op_translation_text, body.dark-mode .op_translation_result, body.dark-mode .op_translation_title, body.dark-mode .op_translation_usertip, body.dark-mode .op_translation_src, body.dark-mode .op_translation_dst { color: #e8e6e3 !important; text-shadow: 0 0 2px rgba(0,0,0,0.5) !important; }' +
                    'body.dark-mode .words-text_5Dlhx span, body.dark-mode .common-text_e22jW, body.dark-mode .fy-dictwisenew-liju-cont_1wU6K *, body.dark-mode .phrase-text_ZmQpU, body.dark-mode .tab-con-head_7gCd7, body.dark-mode .star-text_5tiOq, body.dark-mode .text_5Ce9G, body.dark-mode .title_54JCh, body.dark-mode .video-title_1PCJ2, body.dark-mode .daoliu-con_3XOTP a { color: #e8e6e3 !important; }' +
                    'body.dark-mode .cosc-card-shadow::after, .pc-fresh-smooth .cosc-card-shadow::after { display: none !important; }' +

                    'body.dark-mode #s_tab_inner { display: flex !important; align-items: center !important; flex-wrap: nowrap !important; gap: 4px !important; padding: 8px 0 !important; width: 100% !important; justify-content: center !important; }' +
                    'body.dark-mode .s_tab_inner .s-tab-item, body.dark-mode .s_tab_inner .cur-tab { display: inline-flex !important; align-items: center !important; justify-content: center !important; vertical-align: middle !important; height: 30px !important; line-height: 32px !important; padding: 0 1px !important; margin: 0 2px !important; }' +
                    'body.dark-mode .s_tab_inner .s-tab-item img, body.dark-mode .s_tab_inner .cur-tab img { display: inline-block !important; vertical-align: middle !important; margin-right: 10px !important; width: 16px !important; height: 16px !important; object-fit: contain !important; }' +
                    'body.dark-mode .s_tab_inner .s-tab-item span, body.dark-mode .s_tab_inner .cur-tab { display: inline-block !important; vertical-align: middle !important; white-space: nowrap !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode .s_tab_inner .s-tab-filter { display: inline-flex !important; align-items: center !important; margin-left: 6px !important; }' +

                    'body.dark-mode ._button-group-col_1t6ud_13 { background-color: #3c4043 !important; border: 1px solid #5f6368 !important; }' +
                    'body.dark-mode ._button-group-item_1t6ud_18 { color: #e8e6e3 !important; background-color: transparent !important; }' +
                    'body.dark-mode ._button-group-col_1t6ud_13:hover { background-color: #4d5154 !important; }' +
                    'body.dark-mode .flexible-marker-red { color: #ff8a80 !important; background-color: rgba(255, 138, 128, 0.2) !important; }' +
                    'body.dark-mode .cos-item-desc_7mnJc .cos-divider { border-bottom-color: #3c4043 !important; }' +
                    'body.dark-mode ._tabs-nav-wrapper_1n2to_4 { background-color: #3c4043 !important; }' +
                    'body.dark-mode .input-area_1J3Qm { background-color: #3c4043 !important; border-color: #5f6368 !important; }' +
                    'body.dark-mode .input-area_1J3Qm .cos-input-box { background-color: transparent !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode .input-area_1J3Qm .cos-input-box::placeholder { color: #aaa !important; }' +
                    'body.dark-mode .input-submit-button_3paYP { background-color: #4e6ef2 !important; color: #ffffff !important; border: none !important; }' +
                    'body.dark-mode .text-area-box_4e4nT { background-color: #3c4043 !important; border-radius: 8px !important; }' +
                    'body.dark-mode .text-area_5EkLk { background-color: transparent !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode .text-area_5EkLk::placeholder { color: #aaa !important; }' +
                    'body.dark-mode .publish-btn_5BhsJ { background-color: #4e6ef2 !important; color: #ffffff !important; border-radius: 8px !important; }' +
                    'body.dark-mode .see-more-content_2Bljh { background-color: #3c4043 !important; color: #e8e6e3 !important; border-radius: 6px !important; }' +

                    'body.dark-mode .c-group-wrapper { background: transparent !important; }' +
                    'body.dark-mode ._content-border_1ml43_4, body.dark-mode ._content-border_1ml43_4::before, body.dark-mode ._content-border_1ml43_4::after { border: none !important; box-shadow: none !important; }' +
                    'body.dark-mode .content_309tE, body.dark-mode ._content_1ml43_4 { background-color: #252525 !important; }' +
                    'body.dark-mode .title-wrapper_XLSiK span, body.dark-mode .sub-title_1i3V4 span, body.dark-mode .sc-paragraph, body.dark-mode .icon-text_4yDnQ { color: #e8e6e3 !important; }' +
                    'body.dark-mode .attribute-item_3r4Kz { background-color: #3c4043 !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode .pc-tag_2Nde8 { background-color: #3f51b5 !important; color: #fff !important; }' +
                    'body.dark-mode .button-wrapper_1q1Ke, body.dark-mode .button_5TLOW { background-color: #3c4043 !important; border: 1px solid #5f6368 !important; }' +
                    'body.dark-mode .button-wrapper_1q1Ke div, body.dark-mode .button_5TLOW span { color: #e8e6e3 !important; }' +
                    'body.dark-mode .button-wrapper_1q1Ke:hover { background-color: #4d5154 !important; }' +
                    'body.dark-mode .group-title_4Houf span { color: #e8e6e3 !important; }' +
                    'body.dark-mode .capsule_1g0n7 { background-color: rgba(0,0,0,0.5) !important; color: #fff !important; }' +
                    'body.dark-mode .text_2db6I span { color: #e8e6e3 !important; }' +
                    'body.dark-mode .line_7aHFC { background-color: #5f6368 !important; }' +
                    'body.dark-mode .achievement_FrrQd { background-color: #3c4043 !important; }' +
                    'body.dark-mode .achievement_FrrQd .cos-color-text, body.dark-mode .achievement_FrrQd .achievement-icon_4bWKk { color: #e8e6e3 !important; }' +
                    'body.dark-mode .achievement_FrrQd svg path { fill: #e8e6e3 !important; }' +
                    'body.dark-mode .cos-tabs-header .cos-tab { background-color: #3c4043 !important; border-radius: 16px !important; margin: 0 4px !important; }' +
                    'body.dark-mode .tag-item_2blKp { color: #e8e6e3 !important; padding: 4px 12px !important; }' +
                    'body.dark-mode .cos-tabs-header .cos-tab:hover { background-color: #4d5154 !important; }' +
                    'body.dark-mode .cos-tabs-right-arrow i { color: #e8e6e3 !important; }' +
                    'body.dark-mode .avatar-p_6jWfg.cos-color-text { color: #e8e6e3 !important; }' +
                    'body.dark-mode .avatar-subTitle_6Gcsc { color: #aaa !important; }' +
                    'body.dark-mode .more-btn_1tnGY { background-color: #3c4043 !important; border-radius: 8px !important; }' +
                    'body.dark-mode .more-btn_1tnGY .cos-more-link-text, body.dark-mode .more-btn_1tnGY .cos-icon-right { color: #8ab4f8 !important; }' +
                    'body.dark-mode .interaction_66WRZ, body.dark-mode .baike-slink-wrapper_7k8vl, body.dark-mode .baike-wrapper_6AORN { background-color: #252525 !important; }' +
                    '.pc-fresh-wrapper-ext .new-pmd.c-container { width: 100% !important; max-width: 800px !important; }' +
                    '.c-group-wrapper, div[tpl*="baike"], div[tpl="baike_san"], div[srcid*="baike"], .new-pmd[data-module="baike"], div[data-module="baike"] { width: 100% !important; max-width: 800px !important; margin: 0 auto 25px auto !important; padding: 0 !important; border-radius: 10px !important; box-shadow: 0 3px 10px rgba(0,0,0,0.08) !important; background-color: #fff !important; transition: all 0.3s ease !important; box-sizing: border-box !important; overflow: hidden !important; }' +
                    '.c-group-wrapper .c-group-inner, .c-group-wrapper ._content_1ml43_4, .c-group-wrapper .content_309tE, div[tpl*="baike"] .c-group-inner, div[tpl*="baike"] ._content_1ml43_4 { width: 100% !important; max-width: none !important; padding: 25px !important; margin: 0 !important; box-sizing: border-box !important; }' +
                    '.c-group-wrapper ._bg-header_1ml43_46, ._bg-header_1ml43_46 { width: 100% !important; margin: 0 !important; padding: 25px 25px 0 25px !important; }' +
                    '.c-group-wrapper .title-wrapper_XLSiK, .c-group-wrapper .sub-title_1i3V4, .c-group-wrapper .sc-paragraph { padding-left: 0 !important; padding-right: 0 !important; }' +
                    '.c-group-wrapper .button-wrapper_1q1Ke, .c-group-wrapper .footer_3iz2Q { margin: 0 !important; width: 100% !important; }' +
                    '.c-group-wrapper .group-title_4Houf { padding: 15px 25px !important; margin: 0 !important; }' +
                    '.c-group-wrapper ._horizontal-gradient_1ml43_56, .c-group-wrapper ._radial-gradient-box_1ml43_100, .c-group-wrapper ._border-layer_1ml43_64, .c-group-wrapper ._vertical-gradient_1ml43_197 { display: none !important; }' +
                    '.c-group-wrapper:hover, div[tpl*="baike"]:hover { box-shadow: 0 6px 15px rgba(0,0,0,0.12) !important; transform: translateY(-3px) !important; }' +
                    'div[class*="c-group-wrapper"], .c-container.c-group-wrapper { width: 100% !important; max-width: 800px !important; margin-left: auto !important; margin-right: auto !important; }' +
                    'body.dark-mode .c-group-wrapper, body.dark-mode div[tpl*="baike"] { background-color: #252525 !important; border: 1px solid #333 !important; }' +
                    'body.dark-mode .c-group-wrapper ._bg-header_1ml43_46, body.dark-mode ._bg-header_1ml43_46, body.dark-mode .c-group-wrapper .content_309tE, body.dark-mode .c-group-wrapper ._content_1ml43_4 { background-color: #252525 !important; }' +
                    '.pc-fresh-smooth .c-group-wrapper::after, .pc-fresh-smooth .new-pmd .c-border::after { display: none !important; }' +
                    '.bk_polysemy_1Ef6j .left-image_3TJlK .video-poster_3md57 .video-logo_2HJcT { position: absolute !important; left: 0 !important; bottom: -100px !important; }' +
                                        // ==========================================
                    // ⚡把所有播放按钮在图片正中心
                    // ==========================================
                    // 1. 修复父容器高度塌陷，让其紧紧包裹住图片
                    '.image-wrapper_39wYE, .video-poster_3md57 { position: relative !important; display: inline-block !important; }' +
                    '.image-wrapper_39wYE .c-img, .video-poster_3md57 .c-img { float: none !important; margin: 0 !important; display: block !important; }' +
                    // ==========================================
                    // ⚡ 修复双列模式下“日历组件”被强行截断的问题
                    // ==========================================
                    'body.double-column .c-container[tpl*="calendar"], ' +
                    'body.double-column .result-op[tpl*="calendar"], ' +
                    'body.double-column div[tpl*="calendar"] { ' +
                    'max-height: none !important; ' +        /* 彻底解除 380px 的高度限制 */
                    'height: auto !important; ' +            /* 让日历根据自身内容撑开高度 */
                    'overflow: visible !important; ' +       /* 防止内部的下拉菜单或阴影被切掉 */
                    'padding-bottom: 20px !important; ' +    /* 底部留出呼吸空间 */
                    '}' +

                    // 其他组件
                    'body.dark-mode .scroll-box_2RZdL .tips_33agN { color: #e8e6e3 !important; }' +
                    'body.dark-mode .selectorContainer_5CicL { background-color: #3c4043 !important; border: 1px solid #5f6368 !important; border-radius: 6px !important; }' +
                    'body.dark-mode .selectItem_1bUAj { color: #e8e6e3 !important; }' +
                    'body.dark-mode .selectItem_1bUAj:hover { background-color: #4d5154 !important; }' +
                    'body.dark-mode .pc-rs-upgrade_3SRoo .rs-link_2DE3Q { background: #3c4043 !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode .pc-rs-upgrade_3SRoo .rs-link_2DE3Q:hover { background: #4d5154 !important; }' +
                    'body.dark-mode .foot-container_2X1Nt, body.dark-mode .pc-fresh-wrapper .page_2muyV .page-inner_2jZi2, body.dark-mode #page { background-color: transparent !important; }' +
                    'body.dark-mode .orientation-title-wrapper_YgpKw { background-color: transparent !important; }' +
                    'body.dark-mode .pc-fresh-title-con ._paragraph_klgk1_2, body.dark-mode .pc_Al2N0 .lineheight-normal_1msvK { color: #000 !important; }' +
                    'body.dark-mode .short-answer_bpGXV { color: #e8e6e3 !important; }' +
                    'body.dark-mode .cos-select-option-text { color: #e8e6e3 !important; }' +
                    'body.dark-mode .cos-popover { background-color: #3c4043 !important; color: #e8e6e3 !important; border: 1px solid #5f6368 !important; }' +
                    'body.dark-mode .cos-select-option:hover { background-color: #5f6368 !important; }' +
                    'body.dark-mode .cos-select-entry-placeholder, body.dark-mode .cos-select-entry-text { color: #e8e6e3 !important; }' +
                    '.cu-border._content-border_1q9is_4::after { display: none !important; }' +
                    'body.dark-mode .cos-tag { background-color: #3c4043 !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode .title_7oZ5i { color: #e8e6e3 !important; }' +
                    'body.dark-mode .cos-more-link-line .cos-more-link-container, body.dark-mode .cos-more-link-subtle .cos-more-link-container { border-color: #5f6368 !important; background-color: #3c4043 !important; color: #e8e6e3 !important; }' +
                    '.index-quotation-list_1qZl1 .scroll-page_1w5Lc .scroll-item_4u9LE::after { display: none !important; }' +
                    '.border-module-container_3OL9k::after { display: none !important; }' +
                    'body.dark-mode [data-module="bottom-bar"] button { background: #3c4043 !important; border: 1px solid #5f6368 !important; color: #e8e6e3 !important; }' +
                    'body.dark-mode [data-module="bottom-bar"] button * { color: #e8e6e3 !important; }' +
                    'body.dark-mode .hot-rank_5h8zn .hot-rank-box_1fRyO .hot-rank-list_2O6wP .hot-rank-item_6jERB .info_JbXg3 .name_6ggHn { color: #e8e6e3 !important; }' +
                    '.pc-fresh-wrapper .page_2muyV .page-inner_2jZi2 { width: 100% !important; margin: 0 auto !important; padding-left: 0 !important; display: flex !important; justify-content: center !important; }' +

                    // 日历卡片样式修正
                    'body.dark-mode .calender-box_3bBIx .calendar-tab_YVB65 .calendar-tab-box_3pHF1 .calendar-tab-content_3SYFq, body.dark-mode .calender-box_3bBIx .calendar-tab_YVB65 .calendar-tab-box_3pHF1 .calendar-tab-content_3SYFq * { color: #e8e6e3 !important; background-color: transparent !important; }' +
                    'body.dark-mode .calendar_1ggIJ .wrap_4tS72 .month-item_4SUiq .month-day_3eicC .month-day-text_2WHEx { color: #e8e6e3 !important; }' +
                    // 确保官方置顶样式在页面刷新后依然生效
                    '#content_left > .c-container:first-child, #content_left > .result:first-child { position: relative; padding-bottom: 30px !important; }' +

                    // =========================================================================
                    // 修复百科/知识图谱卡片重叠 & 底部按钮对齐
                    // =========================================================================
                    // 强制取消 Flex 和高度限制，解决文字挤压，让卡片自然撑开
                    '.c-container[tpl="baike"], .c-container[tpl="kg_entity_card"], .c-container.pc-fresh-wrapper-con, .c-container.c-group-wrapper { display: block !important; height: auto !important; max-height: none !important; width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; overflow: visible !important; }' +

                    // 强制底部来源栏沉底，拉开距离，并强制横向排列
                    '.pc-fresh-wrapper-con .source_1Vdff, .c-group-wrapper .source_1Vdff { position: relative !important; clear: both !important; margin-top: 15px !important; padding-top: 10px !important; display: flex !important; align-items: center !important; flex-wrap: nowrap !important; width: 100% !important; height: auto !important; }' +

                    // 强制清除浮动，防止文字内容溢出覆盖底部
                    '.c-container[tpl="baike"]::after, .pc-fresh-wrapper-con::after { content: " " !important; display: table !important; clear: both !important; }' +

                    // ==========================================
                    // ⚡ 百度热搜榜终极补丁 (全模式横向平滑滚动，彻底防截断)
                    // ==========================================
                    // 1. 彻底击碎百度的 min-width 限制
                    'body.pc-fresh-wrapper-con .c-pc-toppic-card, body .c-pc-toppic-card, body .boiling-all_29kBD { min-width: 0 !important; min-width: unset !important; }' +

                    // 2. 根容器自适应重置
                    '.gm-hot-search { position: relative !important; height: auto !important; max-height: none !important; box-sizing: border-box !important; overflow: hidden !important; border-radius: 12px !important; padding: 0 !important; min-width: 0 !important; }' +
                    '.gm-hot-search .bg-wrapper_2Yb28 { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; z-index: 0 !important; }' +
                    '.gm-hot-search .bg-wrapper_2Yb28 img { width: 100% !important; height: 100% !important; object-fit: cover !important; }' +

                    // 3. 重置内部包裹层，干掉 top: 97px
                    '.gm-hot-search .boiling-wrapper_fhywn, .boiling-all_29kBD .boiling-wrapper_fhywn { position: relative !important; top: 0 !important; height: auto !important; max-height: none !important; width: 100% !important; padding: 20px !important; box-sizing: border-box !important; }' +
                    '.gm-hot-search .boiling-contain_3r2Lv { width: 100% !important; max-width: 100% !important; margin: 0 !important; min-width: 0 !important; }' +

                    // 4. 尺寸适配 (单双列) 强制取消百度内部限制宽度的 class
                    'body .gm-hot-search, body .c-pc-toppic-card { width: auto !important; max-width: none !important; }' +

                    // 单列模式：满宽且居中
                    'body.single-column #content_left > .result-op[tpl="boiling-point"], ' +
                    'body.single-column #content_left > .c-container[tpl="boiling-point"], ' +
                    'body.single-column .gm-hot-search, ' +
                    'body.single-column .c-pc-toppic-card { ' +
                    '    width: 100% !important; max-width: 800px !important; margin: 0 auto 25px auto !important; ' +
                    '}' +

                    // 双列模式：满宽完美跨屏，解决变窄与左对齐空白问题
                    'body.double-column #content_left > .result-op[tpl="boiling-point"], ' +
                    'body.double-column #content_left > .c-container[tpl="boiling-point"], ' +
                    'body.double-column .gm-hot-search, ' +
                    'body.double-column .c-pc-toppic-card { ' +
                    '    width: 100% !important; max-width: 100% !important; ' +
                    '    flex: 0 0 100% !important; margin: 0 0 20px 0 !important; ' +
                    '    box-sizing: border-box !important; overflow: hidden !important; ' +
                    '}' +

                    // 确保双列下，即使热搜排在第一个，也横跨100%
                    'body.double-column #content_left > .result-op:first-child[tpl="boiling-point"], ' +
                    'body.double-column #content_left > .c-container:first-child[tpl="boiling-point"] { ' +
                    '    width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; ' +
                    '}' +

                    // 5. 核心：全模式开启横向滚动条，解决截断和挤压问题
                    '.gm-hot-search .boiling-hot-list_3MLaq { ' +
                    '    width: 100% !important; position: relative !important; overflow-x: auto !important; ' +
                    '    overflow-y: hidden !important; scrollbar-width: thin; padding-bottom: 12px !important; ' +
                    '    display: block !important; ' +
                    '}' +
                    '.gm-hot-search .no-swiper-area_52LRg, .gm-hot-search .swiper-wrapper { ' +
                    '    display: flex !important; flex-wrap: nowrap !important; width: 100% !important; ' +
                    '    min-width: max-content !important; justify-content: flex-start !important; gap: 15px !important; ' +
                    '    transform: none !important; transition: none !important; margin: 0 !important; ' +
                    '}' +

                    // 6. 统一卡片尺寸，启用弹性伸缩，自动填满空白
                    '.gm-hot-search .card_1FDsA { ' +
                    '    flex: 1 !important; min-width: 240px !important; max-width: 350px !important; ' +
                    '    height: auto !important; margin: 0 !important; padding: 12px !important; ' +
                    '    box-sizing: border-box !important; border-radius: 8px !important; box-shadow: none !important; ' +
                    '    background-color: rgba(255,255,255,0.1) !important; border: 1px solid rgba(255,255,255,0.2) !important; ' +
                    '}' +
                    '#con-at, .pc-fresh-wrapper-con #con-at { padding-left: 0 !important; width: 100% !important; display: flex !important; justify-content: center !important; margin: 0 auto !important; }' +
                    '#con-at > div { width: 50% !important; max-width: 50% !important; }' +

                    // 7. 防止文字撑破 & 隐藏多余元素
                    '.gm-hot-search .hot-item_1473U { display: flex !important; width: 100% !important; margin-bottom: 8px !important; align-items: center !important; }' +
                    '.gm-hot-search .item-mid_vrw25 { flex: 1 !important; min-width: 0 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }' +
                    '.gm-hot-search .hot-score_2DajL { display: none !important; }' +
                    '.gm-hot-search .mid-img_3-88C { display: flex !important; width: 100% !important; margin-bottom: 15px !important; justify-content: center !important; }' +
                    '.gm-hot-search .boiling-title_ZrdUH img { max-width: 180px !important; height: auto !important; object-fit: contain !important; }' +
                    '.gm-hot-search .row-right_1eYkS, .gm-hot-search .boiling-right_3Etl4 { display: none !important; }' +

                    // 8. 滚动条美化
                    '.boiling-hot-list_3MLaq::-webkit-scrollbar { height: 8px !important; }' +
                    '.boiling-hot-list_3MLaq::-webkit-scrollbar-track { background: transparent !important; }' +
                    '.boiling-hot-list_3MLaq::-webkit-scrollbar-thumb { background: #d0d0d0 !important; border-radius: 4px !important; }' +

                    // 锁定顶部标题区域的高度与溢出隐藏，并将其居中
                    '.gm-hot-search .boiling-contain_3r2Lv .row-left_1OGNu, .boiling-all_29kBD .row-left_1OGNu { padding-top: 2px !important; overflow: hidden !important; flex: 1 !important; min-width: 0 !important; }' +
                    '.gm-hot-search .boiling-contain_3r2Lv .mid-img_3-88C, .boiling-all_29kBD .mid-img_3-88C { position: relative !important; height: 50px !important; display: flex !important; width: 100% !important; margin-bottom: 15px !important; justify-content: center !important; }' +

                    // 9. 深色模式专属上色
                    'body:not(.dark-mode) .gm-hot-search .title-text_16Vh- { color: #fff !important; }' +
                    'body:not(.dark-mode) .gm-hot-search .item-mid_vrw25 { color: #fff !important; }' +
                    'body.dark-mode .gm-hot-search .bg-wrapper_2Yb28 { display: none !important; }' +
                    'body.dark-mode .gm-hot-search { background-color: #252525 !important; border: 1px solid #333 !important; }' +
                    'body.dark-mode .gm-hot-search .card_1FDsA { background-color: #333 !important; border: 1px solid #444 !important; }' +
                    'body.dark-mode .gm-hot-search .boiling-title_ZrdUH img { filter: brightness(0) invert(1) opacity(0.8) !important; }' +
                    'body.dark-mode .gm-hot-search .title-text_16Vh-, body.dark-mode .gm-hot-search .item-mid_vrw25 { color: #e8e6e3 !important; text-shadow: none !important; }' +
                    'body.dark-mode .gm-hot-search .hot-item_1473U:hover .item-mid_vrw25 { color: #8ab4f8 !important; text-decoration: underline !important; }' +
                    'body.dark-mode .gm-hot-search .item-left_21sbZ:not([class*="num-color"]) { color: #888 !important; }' +
                    'body.dark-mode .gm-hot-search .more-text_3Oa53 span, body.dark-mode .gm-hot-search .more-text_3Oa53 i { color: #777 !important; }' +
                    'body.dark-mode .boiling-hot-list_3MLaq::-webkit-scrollbar-thumb { background: #555 !important; }' +
                    'body.dark-mode .boiling-hot-list_3MLaq::-webkit-scrollbar-thumb:hover { background: #777 !important; }';

                GM_addStyle(commonStyles + resultsPageStyles);

                const header = document.getElementById('head');
                if (header) {
                    header.innerHTML = customSearchBoxHTML;
                }
                const query = new URLSearchParams(window.location.search).get('wd');
                if (query) {
                    document.querySelector('.gm-search-input').value = query;
                }

                attachEventListeners();
                rankOfficialSite();
                setupSettingsMenu();
                processRedirects();
                initMainObserver(); // 初始化主观察器
            }
        } catch (error) {
            console.error('百度样式脚本出现错误:', error);
        } finally {
            if (document.body) {
                document.body.style.opacity = '1';
            }
        }
    };

    // ==============================================
    // 翻页&动态内容监听器
    // ==============================================
    function initMainObserver() {

        if (window.mainObserverAttached) return;
        window.mainObserverAttached = true;

        const observerConfig = { childList: true, subtree: true };

        const mainObserver = new MutationObserver((mutations) => {
            let isSignificantChange = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 && (node.id === 'content_left' || (node.querySelector && node.querySelector('#content_left')))) {
                            isSignificantChange = true;
                            break;
                        }
                    }
                }
                if (isSignificantChange) break;
            }

            if (isSignificantChange) {
                mainObserver.disconnect();
                const wrapper = document.getElementById('wrapper');
                if (wrapper) wrapper.style.visibility = 'hidden';

                setTimeout(() => {
                    runModifications();
                    if (wrapper) wrapper.style.visibility = 'visible';
                    if (document.body) mainObserver.observe(document.body, observerConfig);
                }, 0);
            }
        });

        if (document.body) mainObserver.observe(document.body, observerConfig);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runModifications);
    } else {
        runModifications();
    }

    // ==============================================
    // 辅助与功能函数
    // ==============================================
    function attachEventListeners() {
        const input = document.querySelector('.gm-search-input');
        const button = document.querySelector('.gm-search-button');
        const doSearch = () => {
            const query = input.value.trim();
            if (query) window.location.href = 'https://www.baidu.com/s?wd=' + encodeURIComponent(query);
        };
        if (button) button.addEventListener('click', doSearch);
        if (input) input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') doSearch();
        });
    }

    function setupSettingsMenu() {
        if (document.getElementById('settings-toggle')) return;

        const backToTopButton = document.createElement('div');
        backToTopButton.id = 'back-to-top';
        backToTopButton.className = 'gm-control-button';
        backToTopButton.title = '返回顶部';
        backToTopButton.innerHTML =
            '<span class="back-to-top-icon">' +
            '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/><path d="M7.41 20.41L12 15.83l4.59 4.58L18 19l-6-6-6 6z"/></svg>' +
            '</span>';

        const settingsButton = document.createElement('div');
        settingsButton.id = 'settings-toggle';
        settingsButton.className = 'gm-control-button';
        settingsButton.title = '设置';
        settingsButton.innerHTML =
            '<span class="settings-icon">' +
            '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>' +
            '</span>';

        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'settings-panel';
        settingsPanel.innerHTML =
            '<div class="settings-item" id="dark-mode-item"><div class="settings-item-label"><div class="settings-item-icon icon-dark-mode"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3z"/></svg></div><span>深色模式</span></div><div class="toggle-switch" id="dark-mode-switch"></div></div>' +
            '<div class="settings-divider"></div>' +
            '<div class="settings-item" id="layout-item"><div class="settings-item-label"><div class="settings-item-icon icon-layout"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="8" height="16" rx="1" stroke-width="2"/><rect x="13" y="4" width="8" height="16" rx="1" stroke-width="2"/></svg></div><span>双列布局</span></div><div class="toggle-switch" id="layout-switch"></div></div>' +
            '<div class="settings-divider"></div>' +
            '<div class="settings-item" id="ai-hide-item"><div class="settings-item-label"><div class="settings-item-icon icon-ai"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5A2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5a2.5 2.5 0 0 0 2.5 2.5a2.5 2.5 0 0 0 2.5-2.5a2.5 2.5 0 0 0-2.5-2.5"/></svg></div><span>屏蔽AI回答</span></div><div class="toggle-switch" id="ai-hide-switch"></div></div>' +
            '<div class="settings-divider"></div>' +
            '<div class="settings-item" id="auto-page-item"><div class="settings-item-label"><div class="settings-item-icon icon-auto-page"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg></div><span>自动翻页</span></div><div class="toggle-switch" id="auto-page-switch"></div></div>';

        document.body.appendChild(settingsButton);
        document.body.appendChild(backToTopButton);
        document.body.appendChild(settingsPanel);

        let isScrolling = false;
        const toggleBackToTop = () => {
            if (window.pageYOffset > 300) backToTopButton.classList.add('show');
            else backToTopButton.classList.remove('show');
        };

        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    toggleBackToTop();
                    isScrolling = false;
                });
                isScrolling = true;
            }
        });
        toggleBackToTop();

        backToTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

        let isPanelOpen = false;
        settingsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            isPanelOpen = !isPanelOpen;
            settingsPanel.classList.toggle('show', isPanelOpen);
        });

        document.addEventListener('click', (e) => {
            if (!settingsPanel.contains(e.target) && e.target !== settingsButton) {
                isPanelOpen = false;
                settingsPanel.classList.remove('show');
            }
        });

        const darkModeItem = document.getElementById('dark-mode-item');
        const darkModeSwitch = document.getElementById('dark-mode-switch');
        const updateDarkMode = (isDark) => {
            document.body.classList.toggle('dark-mode', isDark);
            darkModeSwitch.classList.toggle('active', isDark);
        };
        darkModeItem.addEventListener('click', () => {
            const isDark = !document.body.classList.contains('dark-mode');
            GM_setValue('darkMode', isDark);
            updateDarkMode(isDark);
        });
        updateDarkMode(GM_getValue('darkMode', false));

        const layoutItem = document.getElementById('layout-item');
        const layoutSwitch = document.getElementById('layout-switch');
        const updateLayout = (isDouble) => {
            document.body.classList.toggle('single-column', !isDouble);
            document.body.classList.toggle('double-column', isDouble);
            layoutSwitch.classList.toggle('active', isDouble);
        };
        layoutItem.addEventListener('click', () => {
            const isDouble = !document.body.classList.contains('double-column');
            GM_setValue('doubleColumn', isDouble);
            updateLayout(isDouble);
        });
        updateLayout(GM_getValue('doubleColumn', false));

        const aiHideItem = document.getElementById('ai-hide-item');
        const aiHideSwitch = document.getElementById('ai-hide-switch');
        const updateAiHide = (isHide) => {
            document.body.classList.toggle('hide-ai', isHide);
            aiHideSwitch.classList.toggle('active', isHide);
        };
        aiHideItem.addEventListener('click', () => {
            const isHide = !document.body.classList.contains('hide-ai');
            GM_setValue('hideAi', isHide);
            updateAiHide(isHide);
        });
        updateAiHide(GM_getValue('hideAi', true));

        const aiPageItem = document.getElementById('auto-page-item');
        const autoPageSwitch = document.getElementById('auto-page-switch');
        const updateAutoPage = (isEnabled) => {
            autoPageSwitch.classList.toggle('active', isEnabled);
            if (isEnabled && window.location.pathname === '/s') {
                setTimeout(() => {
                    if (window.AutoPagination) window.AutoPagination.enable();
                }, 300);
            } else if (!isEnabled && window.AutoPagination) {
                window.AutoPagination.disable();
            }
        };
        aiPageItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const isEnabled = !autoPageSwitch.classList.contains('active');
            GM_setValue('autoPageEnabled', isEnabled);
            updateAutoPage(isEnabled);
            showToast(isEnabled ? '✅ 自动翻页已开启' : '❌ 自动翻页已关闭');
        });
        updateAutoPage(GM_getValue('autoPageEnabled', false));
    }

    function rankOfficialSite() {
        setTimeout(() => {
            const resultsContainer = document.getElementById('content_left');
            if (!resultsContainer) return;
            const results = Array.from(resultsContainer.children).filter(el => el.matches('.c-container[id], .result[id]'));
            let bestResult = null;
            let topScore = -1;
            const query = new URLSearchParams(window.location.search).get('wd') || '';

            results.forEach((result, index) => {
                let score = 0;
                const linkElement = result.querySelector('h3 a, .t a');
                if (!linkElement) return;
                const href = linkElement.href || '';
                const title = linkElement.textContent || '';
                const isOfficial = result.querySelector('span.suffix-icon_3Ox2w span.tag_6iNm4.www-tag-fill-blue_3n0y3') ||
                    (result.querySelector('span.tag_6iNm4') && result.querySelector('span.tag_6iNm4').textContent.trim() === '官方') ||
                    result.querySelector('[data-is-official="1"]') || result.querySelector('.c-icon-official');

                if (isOfficial) score += 150;
                if (index === 0) score += 50;
                try {
                    const domain = new URL(href).hostname.replace('www.', '');
                    if (query && domain.startsWith(query.toLowerCase().replace(/\s/g, ''))) score += 30;
                } catch (e) {}
                if (title.includes('官网') || title.includes('官方')) score += 20;
                if (score > topScore) { topScore = score; bestResult = result; }
            });

            if (bestResult && topScore > 100) {
                if (resultsContainer.firstElementChild !== bestResult) resultsContainer.insertBefore(bestResult, resultsContainer.firstElementChild);
                let hint = bestResult.querySelector('.gm-official-hint');
                if (!hint) {
                    hint = document.createElement('div');
                    hint.className = 'gm-official-hint';
                    bestResult.appendChild(hint);
                }
                hint.textContent = '官方网站结果已置顶';
            }
        }, 500);
    }

    function fixBaiduHotSearch() {
        const wrappers = document.querySelectorAll('.boiling-wrapper_fhywn');
        wrappers.forEach(wrapper => {
            let topCard = wrapper.closest('.c-pc-toppic-card') || wrapper.closest('.boiling-all_29kBD');
            if (!topCard) topCard = wrapper;
            if (!topCard.classList.contains('gm-hot-search')) topCard.classList.add('c-container', 'gm-hot-search');
            if (topCard.style.height) topCard.style.height = '';
            if (topCard.style.width) topCard.style.width = '';
            if (wrapper.style.height) wrapper.style.height = '';
        });
        document.querySelectorAll('.boiling-wrapper_fhywn .left-btn_3tTYg, .boiling-wrapper_fhywn .right-btn_sh5Wo').forEach(btn => {
            if (btn.style.display !== 'none') btn.style.display = 'none';
        });
    }

    function initForceStyleFixer() {
        let interval = 500;
        let executionCount = 0;
        let fixerTimer = null;

        const runFixer = () => {
            try {
                const ads = document.querySelectorAll('#s_popup_advert, .popup-advert, .advert-shrink, .advert-shrink2');
                ads.forEach(node => node.remove());
                fixBaiduHotSearch();
            } catch (e) {}
            executionCount++;
            if (executionCount === 10 && fixerTimer) {
                clearInterval(fixerTimer);
                interval = 2500;
                fixerTimer = setInterval(runFixer, interval);
            }
        };
        fixerTimer = setInterval(runFixer, interval);
    }

    initForceStyleFixer();

    if (window.location.pathname === '/s') {
        const initAutoPage = () => {
            const autoPageEnabled = GM_getValue('autoPageEnabled', false);
            if (autoPageEnabled && window.AutoPagination) setTimeout(() => window.AutoPagination.enable(), 300);
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAutoPage);
        else setTimeout(initAutoPage, 1000);
    }

})();
