# Baidu-Search

百度搜索功能和样式优化。添加单双列布局切换，官网置顶功能，优化百度官方标识识别，增加深色模式切换，移除百度搜索结果跳转页面，并加宽搜索结果。

此脚本由 AI 编写，各处已经添加中文注释，有问题可以反馈，也可以自行解决。欢迎提交优化和修改后的代码<br>

此脚本去除百度各种广告，还首页清爽，搜索结果页面居中加宽页面，添加更完美的深色模式，重定向，等功能<br>

建议配合自动翻页脚本一起搭配使用，效果更佳<br>

也可以前往 https://greasyfork.org/zh-CN/scripts/543000 安装


****
<table>
  <tr>
    <td align="center">效果图</td>
  </tr>
</table>

<table>
  <tr>
    <td align="center">未安装脚本的首页效果</td>
    <td align="center">安装脚本的首页效果</td>
  </tr>
  <tr>
    <td><img src="https://cdn.jsdelivr.net/gh/ishdy/Baidu-Search@main/images/%E6%9C%AA%E5%AE%89%E8%A3%85%E8%84%9A%E6%9C%AC%E9%A6%96%E9%A1%B5.png" width="100%" /></td>
    <td><img src="https://cdn.jsdelivr.net/gh/ishdy/Baidu-Search@main/images/%E5%AE%89%E8%A3%85%E8%84%9A%E6%9C%AC%E9%A6%96%E9%A1%B5.png" width="100%" /></td>
  </tr>
</table>

<table>
  <tr>
    <td align="center">搜索结果单列居中效果</td>
    <td align="center">搜索结果双列居中效果</td>
  </tr>
  <tr>
    <td><img src="https://cdn.jsdelivr.net/gh/ishdy/Baidu-Search@main/images/%E6%90%9C%E7%B4%A2%E7%BB%93%E6%9E%9C%E5%8D%95%E5%88%97%E5%B1%85%E4%B8%AD%E6%95%88%E6%9E%9C.png" width="100%" /></td>
    <td><img src="https://cdn.jsdelivr.net/gh/ishdy/Baidu-Search@main/images/%E6%90%9C%E7%B4%A2%E7%BB%93%E6%9E%9C%E5%8F%8C%E5%88%97%E5%B1%85%E4%B8%AD%E6%95%88%E6%9E%9C.png" width="100%" /></td>
  </tr>
</table>

<table>
  <tr>
    <td align="center">单列居中深色样式效果</td>
    <td align="center">双列居中深色样式效果</td>
  </tr>
  <tr>
    <td><img src="https://cdn.jsdelivr.net/gh/ishdy/Baidu-Search@main/images/%E5%8D%95%E5%88%97%E5%B1%85%E4%B8%AD%E6%B7%B1%E8%89%B2%E6%A0%B7%E5%BC%8F%E6%95%88%E6%9E%9C.png" width="100%" /></td>
    <td><img src="https://cdn.jsdelivr.net/gh/ishdy/Baidu-Search@main/images/%E5%8F%8C%E5%88%97%E5%B1%85%E4%B8%AD%E6%B7%B1%E8%89%B2%E6%A0%B7%E5%BC%8F%E6%95%88%E6%9E%9C.png" width="100%" /></td>
  </tr>
</table>

**** 
# Baidu-search 更新日志

<br>
v1.62<br>
更新@connect   更加具体,避免无痕或隐私模式下自动翻页功能无法使用.<br>
<br>
v1.61<br>
1.遮罩拦截 + 加载动画.<br>
2.其它细节优化<br>
<br>
v1.60<br>
1.增加自动翻页功能,可以在左下角设置按钮自行觉得是否开启.<br>
2.其它细节优化<br>
<br>
v1.59<br>
修复百度百科部分图片显示不正常的错误<br>
<br>
v1.58<br>
删除1.57版本中默认屏蔽的"百度AI创作".pc-dashboard, .pcsearch-common-ai-dashboard,因为百度设置中可以自行选择是否关闭<br>
<br>
v1.57<br>
1.修复百度首页logo和搜索框定位,防止开启或关闭热搜后logo发生位移<br>
2.修复浅色模式下logo反色问题<br>
3.默认屏蔽首页的"百度AI创作",如果不想屏蔽可以代码中搜素.pc-dashboard, .pcsearch-common-ai-dashboard进行删除就可以正常显示<br>
<br>
v1.56<br>
修改百度首页搜索框层级,避免遮挡设置等百度原生弹出式的内容<br>
<br>
v1.55<br>
1.删除首页搜索框底下的方框,只保留椭圆外观,使其更美观<br>
2.其它的优化细节<br>
<br>
v1.54<br>
布局优化细节<br>
<br>
v1.53<br>
优化细节<br>
<br>
v1.52<br>
1.增加屏蔽规则<br>
2.有些广告油猴无法过滤,需要去广告扩展的过滤规则<br>
3.强烈建议使用单列模式,双列模式由于结果的内容不同,难免会导致排版混乱的问题<br>
<br>
v1.51<br>
1.修复双列模式下置顶样式<br>
2.其它细节优化<br>
3.针对双列模式下"内容过窄"的精准修复,如果排版还是混乱的话,自查一下去广告扩展的过滤规则<br>
<br>
v1.50<br>
1.增加左下角设置按钮自定义是否屏蔽AI回答功能<br>
2.修复浅色模式下结果页面搜索框下方导航栏显示问题<br>
3.其它一些细节优化<br>
<br>
v1.49<br>
仅在非移动端生效，防止移动端白屏或出现乱码<br>
<br>
v1.48<br>
修复搜索结果页面内点击链接后"官方网站已置顶"样式丢失的错误<br>
<br>
v1.47<br>
百度首页又出现广告,增加屏蔽规则,优化一些代码<br>
<br>
v1.46<br>
优化并增加几处深色样式，如有问题可反馈<br>
<br>
v1.45<br>
增加屏蔽规则。美化设置按钮 UI ,  右下角增加返回顶部按钮。<br>
<br>
v1.44<br>
修复一处bug( 解决闪烁  )<br>
<br>
v1.43<br>
增加搜索结果双列居中模式，左下角点开后可切换深色模式和单双列模式，双列模式暂时还有点小问题，建议使用单列居中模式。<br>
如有问题可反馈<br>
<br>
v1.42<br>
精简代码（去除重复陈旧过时的样式)，难免精简过度，如有问题可反馈<br>
<br>
v1.41<br>
优化深色样式，如有问题可反馈<br>
<br>
v1.40<br>
优化深色样式，如有问题可反馈<br>
<br>
v1.39<br>
更新屏蔽规则，如有问题可反馈<br>
<br>
v1.38<br>
继续优化深色样式，现在已经接近完美，如有问题可反馈<br>
<br>
v1.37<br>
继续优化深色样式<br>
<br>
v1.36<br>
去掉百度保障置顶功能，因为百度会推广广告<br>
其它一下细节优化<br>
<br>
v1.35<br>
百度百科样式优化，继续优化深色样式<br>
<br>
v1.34<br>
优化深色样式<br>
<br>
v1.33<br>
更新屏蔽规则，继续优化深色样式<br>
<br>
v1.32<br>
继续优化深色模式下的细节<br>
<br>
v1.31<br>
继续优化深色模式样式<br>
<br>
v1.30<br>
优化深色模式样式，增加屏蔽AI回答规则，其它一些细节调整<br>
<br>
v1.29<br>
优化搜索结果置顶方案，增强识别<br>
<br>
v1.28<br>
继续优化深色模式样式-新脚本更新可能比较频繁，见谅<br>
<br>
v1.27<br>
修正一处错误<br>
<br>
v1.26<br>
继续深色模式下的优化，并修正一处显示错误<br>
<br>
v1.25<br>
深色模式下，细节优化<br>
<br>
v1.24<br>
深色模式下，细节优化<br>
<br>
v1.23<br>
优化深色模式细节<br>
<br>
v1.22<br>
优化细节，和语法错误<br>
<br>
v1.21<br>
修复一处未居中的错误<br>
<br>
v1.20<br>
移除百度搜索结果页面右侧信息，移除链接跳转（重定向），并加宽、居中显示搜索结果，移除对AC脚本的依赖，现在可以独立运行<br>
<br>
v1.19<br>
增加AI结果等屏蔽规则<br>
<br>
v1.18<br>
增加搜索结果页面深色模式，切换按钮在左下角，本次更细只对搜索结果页面进行更新。<br>
首页不影响，如果首页想要深色模式，可以在首页自定义图片自行添加，效果如附加的效果图<br>
<br>
v1.17<br>
优化搜索结果页面的官方标识识别<br>
<br>
v1.16<br>
增加 - 屏蔽百度推广和广告链接<br>
增加 - 搜索结果页面的官网置顶功能<br>
屏蔽首页热点新闻，ai-input 等，详见注释<br>
注释进行了规范化处理，并提高了代码的对齐度<br>
<br>
v1.15<br>
百度首页貌似又更新了，修复首页出现两个搜索框的bug<br>
<br>
v1.14<br>
添加  // @icon<br>
<br>
v1.13<br>
修改说明，重新截图<br>
<br>
v1.12<br>
添加// @license            MIT<br>
<br>
v1.11<br>
修改搜索结果页面工具栏间距<br>
<br>
v1.10<br>
更新搜索结果页面工具栏被屏蔽的bug<br>
