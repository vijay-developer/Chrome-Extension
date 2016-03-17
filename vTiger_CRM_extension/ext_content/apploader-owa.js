(function(utils,props,$,scanner){window.firstTimeLoadSite=true;function getMainContainer(){return $('[role="main"]');}
function getAvailableWidthForMailView(){var status=$('#varchrome_ext').hasClass('off')?'off':'on';var fullWidth=$(window).width();var size=fullWidth;if(status=='on')size-=props.sidebarWidth;else size-=40;return size;}
function AppLoader(){this.switchSidebarState=switchSidebarState=function(state){utils.log('switch to '+state);var domState=$('#varchrome_ext').hasClass('off')?'off':'on';var switchTo=state;if(switchTo=='off'){$('#varchrome_ext').addClass('off');$('.tab-content').hide();$('.header-bar span').hide();getMainContainer().width(getAvailableWidthForMailView());$('.btn-collapse-app').attr('title','Open CRM');$('.btn-collapse-app').attr('data-original-title','Open CRM');}else{$('.tab-content').show();$('.header-bar span').show();$('#varchrome_ext').removeClass('off');getMainContainer().width(getAvailableWidthForMailView());$('.btn-collapse-app').attr('title','Hide CRM');$('.btn-collapse-app').attr('data-original-title','Hide CRM');}
$.jStorage.set('vte_sidebar_state',switchTo);};this.bootIntoVGrome=bootIntoVGrome=function(){utils.log('Apploader:boot:start');var bootElement=document.getElementById('varchrome_ext');angular.element(bootElement).ready(function(){angular.bootstrap(bootElement,['VGrome']);});utils.log('Apploader:boot:done');};this.updateContainerSize=updateContainerSize=function(){if(getMainContainer()){setTimeout(function(){$('#varchrome_ext').height(getMainContainer().height());$('.tab-content').height(getMainContainer().height()-47);$('#varchrome_ext .app-menu').height(getMainContainer().height());$('#varchrome_ext .app-body').height(getMainContainer().height());$('#app-dialog-container').height($('.app-body').height());},500);}else{setTimeout(function(){updateContainerSize();},100);}};this.initialDialogAndBaseData=function(){window.AppDialog={show:function(title,msg){if(title){$('.app-dialog-header .title-text').text(title);}
if(msg){$('.app-dialog-body .message-text').html(msg);}
$('#app-dialog-container').fadeIn('fast');}};window.summaryData=false;window.appStatus={selectedEmail:false,isDevMode:false,replyTrigger:false,};window.appProps=props;$('body').on('click','#app-dialog-container',function(e){var target=e.target;var that=this;if($(target).attr('id')=='app-dialog-container'){$(that).fadeOut('fast');}});$('body').on('click','.ok-btn',function(){$('#app-dialog-container').fadeOut('fast');});};this.loadAppContent=loadAppContent=function(){this.initialDialogAndBaseData();function doLoad(){utils.log('Apploader:loadApp');window.vgrome=angular.module('VGrome',[]);window.vgrome.config(function($sceProvider){$sceProvider.enabled(false);});utils.insertScript(['app/models/util_service.js','app/models/api_provider.js','app/controllers/entity.js','app/controllers/inventory.js','app/controllers/base-index.js','app/controllers/index-owa.js','app/controllers/account.js','app/controllers/calendar.js','app/controllers/config.js','app/controllers/person.js','app/controllers/potential.js','app/controllers/quote.js','app/controllers/invoice.js','app/controllers/search.js','app/controllers/summary.js','app/controllers/ticket.js','app/controllers/popup-detail.js'],function(res){utils.downloadTemplate('app/views/index.html',function(appHtml){var baseHtml='<div id="varchrome_ext" class="vgrome-enable">'+appHtml+'</div>';$(baseHtml).insertAfter(getMainContainer());var currentTime=(new Date()).getTime();var totalTimeLoad=currentTime-window.startLoad;utils.log("Resource loaded in "+totalTimeLoad+"ms");bootIntoVGrome();var storageState=$.jStorage.get('vte_sidebar_state');if(storageState==null)storageState='on';switchSidebarState(storageState);});});var cssQueue=['libs/org/css/ui-vendor.css','libs/vgrome-vertial-tab.css','libs/select2/select2.css','libs/datepicker/vgrome-datepicker.css','libs/timepicker/jquery.timepicker.css','libs/font-awesome/css/font-awesome-vgrome.css','libs/metro-checkboxradio.css','css/global-outlook.css'];utils.insertCss(cssQueue);$('body').tooltip({selector:'.tooltip-tab'});$(window).resize(function(){setTimeout(function(){var storageState=$.jStorage.get('vte_sidebar_state');if(storageState==null)storageState='on';switchSidebarState(storageState);});});utils.log('Apploader:loadDone');}
doLoad();setInterval(function(){updateContainerSize();},1000);};}
window.Apploader=new AppLoader();})(UTILS,PROPS,jQuery,window.Scanner);