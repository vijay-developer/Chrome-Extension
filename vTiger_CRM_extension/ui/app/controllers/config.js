(function(utils, $, $HELPER){
    var $app = window.netvill;

    $app.controller('ConfigCtrl', ['$scope', 'apiProvider', function ($scope, $apiProvider) {

        $scope.appKey = '';
        $scope.username = '';
        $scope.user = {};

        $scope.safeApply = function(fn) {
            var phase = this.$root.$$phase;
            if(phase == '$apply' || phase == '$digest') {
                if(fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };

        window.configCtrl = $scope;

        $scope.initCtrl = function(){
            if(isAuth()) {
                $scope.user = {
                    fullName: userdata.user.firstname + ' ' + userdata.user.lastname,
                    email: userdata.user.email,
                    vtiger: userdata.user.vtiger_url
                };
            }
        };

        $scope.isDevMode = function(){
            return window.appStatus.isDevMode;
        };

        $scope.submitLogin = submitLogin = function() {
            utils.showLoading('rendering page...');
			alert($scope.username +" == "+ $scope.appKey)
            $apiProvider.login($scope.username, $scope.appKey, function(result){
                if(result.success == 1) {
                    if(result.sid != null) {
                        //Save session
                        $.jStorage.set('__sid', result.sid);
                        $.jStorage.set('__uid', result.uid);

                        $scope.$parent.setAuth(true);
                        $scope.$parent.initUser(function(){
                            $scope.initCtrl();
                            $scope.safeApply();
                            utils.hideLoading();
                            if(!empty(indexCtrl)) {
                                indexCtrl.reloadTabList();
                            }

                            $('.tab-content').not('.tab-config').remove();
                        });
                    } else {
                        var errorMessage = 'The session cannot be generated. <br /> Please <a target="_blank" href="http://www.netvill.com/faq/error-the-session-cannot-be-generated/">click here</a> for more information.';
                        utils.hideLoading();
                        window.AppDialog.show('ERROR', errorMessage);
                    }
                } else {
                    utils.handleError(result);
                    utils.hideLoading();
                }
            });
        };

        $scope.logout = logout = function() {
            if(confirm('Are you sure?')) {
                utils.showLoading();
                $apiProvider.logout(function () {
                    $.jStorage.deleteKey('__sid');
                    $.jStorage.deleteKey('userdata');
                    $scope.$parent.setAuth(false);
                    $scope.$parent.loadGuestTab();
                    $scope.$parent.safeApply();
                    utils.hideLoading();
                });
            }
        };

        $scope.runConsole = runConsole = function(){
            $command = $('#console').val();
            eval($command);
        };

        $scope.updateConfiguration = updateConfiguration = function(){
            utils.showLoading();
            $apiProvider.getPreferences(function (result) {
                if(result['success']) {
                    window.userdata = result;
                    $.jStorage.set('userdata', result);
                    utils.hideLoading();
                } else {
                    utils.handleError(result);
                    utils.hideLoading();
                }
            });
        };

        $scope.getResourceBaseUrl = function(){
            return window.appProps.RB;
        };

    }]);

})(UTILS, jQuery, window.VTEHelperInstance);