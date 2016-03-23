(function($, utils, $HELPER){
    var $app = window.vgrome;

    $app.controller('InventoryCtrl', ['$scope', '$compile', 'lang', 'apiProvider', '$controller',
        function ($scope, $compile, $lang, $apiProvider, $controller) {

            $.extend(this, $controller('EntityCtrl', {$scope: $scope}));

            $scope.LineItems = [];
            $scope.invData = {
                totalDiscount: 0,
                shipAndHandlingCharge: 0,
                adjustment: 0
            };

            $scope.addItem = addItem = function(productData) {
                productData.listPrice = parseFloat(productData.unit_price).toFixed(2);
                productData.qty = 1;
                productData.discount = 0;
                productData.comment = '';
                $scope.LineItems.push(productData);
                $scope.safeApply();
            };

            $scope.removeItem = removeItem = function(productData){
                $scope.LineItems = _.filter($scope.LineItems, function(item){
                    return item.id != productData.id;
                });
            };

            $scope.calculateListPriceCreate = calculateListPriceCreate = function(lineItem) {
                var listPrice = (parseFloat(lineItem.listPrice) * parseFloat(lineItem.qty)).toFixed(2);
                var discountValue = parseFloat(lineItem.discount);

                if(isNaN(discountValue) || discountValue == '') discountValue = 0;

                if((lineItem.discount + '').indexOf('%') != -1) {
                    discountValue = parseFloat($HELPER.replaceAll('%', '', lineItem.discount));
                    discountValue = listPrice / 100 * discountValue;
                    lineItem.discountPercent = discountValue;
                } else {
                    lineItem.discountPercent = '';
                }

                listPrice -= discountValue;
                return listPrice.toFixed(2);
            };

            $scope.getItemTotal = getItemTotal = function() {
                var total = 0;
                $($scope.LineItems).each(function(i, o){
                    total += parseFloat(calculateListPriceCreate(o));
                });
                return total.toFixed(2);
            };

            $scope.getTotalDiscount = getTotalDiscount = function() {
                var discountValue = parseFloat($scope.invData.totalDiscount);

                if(isNaN(discountValue) || discountValue == '') discountValue = 0;

                if(($scope.invData.totalDiscount + '').indexOf('%') != -1) {
                    discountValue = parseFloat($HELPER.replaceAll('%', '', $scope.invData.totalDiscount));
                    discountValue = getItemTotal() / 100 * discountValue;
                    $scope.discountPercent = discountValue;
                } else {
                    $scope.discountPercent = 0;
                }

                return discountValue.toFixed(2);
            };

            $scope.getPreTaxTotal = getPreTaxTotal = function() {
                var preTaxTotal = getItemTotal();
                preTaxTotal -= getTotalDiscount();
                preTaxTotal += getShipAndHandlingCharge();
                return preTaxTotal.toFixed(2);
            };

            $scope.getTax = getTax = function() {
                var percent = 0;
                $(userdata.tax_list).each(function(taxIndex, tax) {
                    percent += parseFloat(tax.percent);
                });
                return percent;
            };

            $scope.getTaxValue = getTaxValue = function(){
                var grandTotal = getItemTotal();
                grandTotal -= getTotalDiscount();
                //grandTotal += getShipAndHandlingCharge();
                return (grandTotal / 100 * getTax()).toFixed(2);
            };

            $scope.getShipAndHandlingCharge = getShipAndHandlingCharge = function(){
                if(isNaN($scope.invData.shipAndHandlingCharge) || $scope.invData.shipAndHandlingCharge == '') return 0;

                return parseFloat($scope.invData.shipAndHandlingCharge);
            };

            $scope.getAdjustment = getAdjustment = function(){
                if(isNaN($scope.invData.adjustment) || $scope.invData.adjustment == '') return 0;

                return parseFloat($scope.invData.adjustment);
            };

            $scope.getGrandTotal = getGrandTotal = function() {
                var grandTotal = getItemTotal();
                grandTotal -= getTotalDiscount();
                grandTotal += grandTotal / 100 * getTax();
                grandTotal += getShipAndHandlingCharge();
                grandTotal += getAdjustment();

                return grandTotal.toFixed(2);
            };

            $scope.submitCreate = submitCreate = function() {
                var templateFields = $scope.focusFields;
                var post = {};

                _.each(templateFields, function(block){
                    _.each(block.items, function(field){
                        if(field.uitype.name == 'boolean') {
                            var value = $('.create-section #inp_'+$scope.focusObject+'_'+field.name).prop( "checked" );
                            value = value ? 1 : 0;
                        } else {
                            var value = $('.create-section #inp_'+$scope.focusObject+'_'+field.name).val();
                        }

                        value = $HELPER.formatToVTFormat(field, value);

                        post[field.name] = value;
                    });
                });

                if(summaryData != false && summaryData.type == 'Contacts') {
                    post['contact_id'] = summaryData.id;
                }

                var lineItems = [];
                $($scope.LineItems).each(function(i, item){
                    lineItems.push({
                        productid: item.id,
                        quantity: item.qty,
                        listprice: item.listPrice,
                        discount_percent: item.discountPercent,
                        discount_amount: item.discount,
                        comment: item.comment
                    });
                });

                post['LineItems'] = lineItems;
                post['productid'] = lineItems[0].productid;
                post['quantity'] = lineItems[0].quantity;
                post['txtAdjustment'] = getAdjustment();
                post['hdnTaxType'] = 'group';
                post['hdnDiscountPercent'] = $scope.discountPercent;
                post['hdnDiscountAmount'] = getTotalDiscount();
                post['hdnS_H_Amount'] = getShipAndHandlingCharge();

                utils.showLoading();
                $apiProvider.createObject($scope.focusObject, post, function(result){
                    if(result.success) {
                        //Reset data after created
                        $scope.LineItems = [];
                        $scope.invData.totalDiscount = 0;
                        $scope.invData.shipAndHandlingCharge = 0;
                        $scope.invData.adjustment = 0;

                        var record = result.record;
                        utils.hideLoading();
                        $scope.enableShowDetail(record.id);
                    } else {
                        utils.handleError(result, $scope.focusObject);
                        utils.hideLoading();
                    }
                });
            };

            $scope.backHistory = backHistory = function () {
                if(window.summaryData) {
                    $scope.mode = 'ref-list';


                } else {
                    $scope.mode = 'index';
                }
            };
        }]);
})(jQuery, window.UTILS, window.VTEHelperInstance);