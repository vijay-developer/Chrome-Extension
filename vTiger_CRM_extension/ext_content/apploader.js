(function(utils,props,$,scanner){window.firstTimeLoadSite=true;function AppLoader(){this.switchSidebarState=switchSidebarState=function(state){utils.log('switch to '+state);var domState=$('#varchrome_ext').hasClass('off')?'off':'on';var switchTo=state;if(switchTo=='off'){$('#varchrome_ext').addClass('off');$('.tab-content').hide();$('.header-bar span').hide();utils._getMailListView().width(utils._getAvailableWidthForMailList());utils._getToolbar().width(utils._getAvailableWidthForMailList()-10);utils._getToolbar2().width(utils._getAvailableWidthForMailList()-10);$('.btn-collapse-app').attr('title','Open Corrensa');$('.btn-collapse-app').attr('data-original-title','Open Corrensa');}else{$('.tab-content').show();$('.header-bar span').show();$('#varchrome_ext').removeClass('off');utils._getMailListView().width(utils._getAvailableWidthForMailList());utils._getToolbar().width(utils._getAvailableWidthForMailList()-10);utils._getToolbar2().width(utils._getAvailableWidthForMailList()-10);$('.btn-collapse-app').attr('title','Hide CRM');$('.btn-collapse-app').attr('data-original-title','Hide CRM');}
$.jStorage.set('vte_sidebar_state',switchTo);utils._getMailListView().width(utils._getAvailableWidthForMailList());utils._getMailListWrapper().width(utils._getAvailableWidthForMailList());};this.bootIntoVGrome=bootIntoVGrome=function(){utils.log('Gmail:Apploader:boot:start');var bootElement=document.getElementById('varchrome_ext');angular.element(bootElement).ready(function(){angular.bootstrap(bootElement,['VGrome']);});utils.log('Apploader:boot:done');};this.updateContainerSize=updateContainerSize=function(){if(utils._getMailListHeight()){setTimeout(function(){$('#varchrome_ext').height(utils._getMailListHeight()+47);$('.tab-content').height(utils._getMailListHeight());$('#varchrome_ext .app-menu').height(utils._getMailListHeight());$('#varchrome_ext .app-body').height(utils._getMailListHeight());$('#app-dialog-container').height($('.app-body').height());},500);}else{setTimeout(function(){updateContainerSize();},100);}};this.initialDialogAndBaseData=function(){window.AppDialog={show:function(title,msg){if(title){$('.app-dialog-header .title-text').text(title);}
if(msg){$('.app-dialog-body .message-text').html(msg);}
$('#app-dialog-container').fadeIn('fast');}};window.summaryData=false;window.appStatus={selectedEmail:false,isDevMode:false,replyTrigger:false,};window.appProps=props;$('body').on('click','#app-dialog-container',function(e){var target=e.target;var that=this;if($(target).attr('id')=='app-dialog-container'){$(that).fadeOut('fast');}});$('body').on('click','.ok-btn',function(){$('#app-dialog-container').fadeOut('fast');});};this.loadAppContent=loadAppContent=function(){this.initialDialogAndBaseData();function doLoad(){utils.log('Apploader:loadApp');window.vgrome=angular.module('VGrome',[]);window.vgrome.config(function($sceProvider){$sceProvider.enabled(false);});utils.insertScript(['app/models/util_service.js','app/models/api_provider.js','app/controllers/entity.js','app/controllers/inventory.js','app/controllers/base-index.js','app/controllers/index.js','app/controllers/account.js','app/controllers/calendar.js','app/controllers/config.js','app/controllers/person.js','app/controllers/potential.js','app/controllers/quote.js','app/controllers/invoice.js','app/controllers/search.js','app/controllers/summary.js','app/controllers/ticket.js','app/controllers/popup-detail.js'],function(res){utils.downloadTemplate('app/views/index.html',function(appHtml){var baseHtml='<div id="varchrome_ext" class="vgrome-enable">'+appHtml+'</div>';$(baseHtml).insertAfter(utils._getMailListView());var currentTime=(new Date()).getTime();var totalTimeLoad=currentTime-window.startLoad;utils.log("Resource loaded in "+totalTimeLoad+"ms");bootIntoVGrome();var storageState=$.jStorage.get('vte_sidebar_state');if(storageState==null)storageState='on';switchSidebarState(storageState);var listenForIndexContainer=setInterval(function(){if($('#index-container').length>0){scanner.load();clearInterval(listenForIndexContainer);}},300);});});var cssQueue=['app/css/ui-vendor.css','app/css/vgrome-vertial-tab.css','app/css/select2.css','app/css/vgrome-datepicker.css','app/css/jquery.timepicker.css','app/css/font-awesome-vgrome.css','app/css/metro-checkboxradio.css','app/css/global.css'];utils.insertCss(cssQueue);$('body').tooltip({selector:'.tooltip-tab'});$(window).resize(function(){setTimeout(function(){var storageState=$.jStorage.get('vte_sidebar_state');if(storageState==null)storageState='on';switchSidebarState(storageState);});});utils.log('Apploader:loadDone');}
var waitingForGmail=setInterval(function(){if($('#loading:hidden').length>0){doLoad();clearInterval(waitingForGmail);}
utils.log('Still waiting for gmail loading');},500);setInterval(function(){updateContainerSize();},1000);};}
window.Apploader=new AppLoader();})(UTILS,PROPS,jQuery,window.Scanner);