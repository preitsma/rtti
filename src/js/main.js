/// <reference path="../plugins/ng-grid-reorderable.js" />
/// <reference path="../ng-grid-1.0.0.debug.js" />

var rttiApp = angular.module('rttiApp', ['ngGrid', 'ngRoute', 'ui.bootstrap', 'angular-carousel']);

//Define Routing for app
//Uri /             -> template grid.html and Controller GridController
//Uri /wizard       -> template wizard.html and Controller WizardController
rttiApp.config(function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'incl/grid.html',
        controller: 'GridController'
    }).
      when('/wizard/:leerlingId', {
        templateUrl: 'incl/wizard.html',
        controller: 'WizardController'
      }).
      otherwise({
        redirectTo: '/'
      });
});

rttiApp.factory('dataFactory', function($http) {

   var urlBase = 'api';
   var dataFactory = {};

   dataFactory.getKlas = function () {
      return $http.get(urlBase + "/klas.json");
   }

   dataFactory.getProefwerk = function () {
      return $http.get(urlBase + "/proefwerk.json");
   }

   return dataFactory;

});


rttiApp.controller('GridController', function($scope, $log, $modal, $timeout, dataFactory) {
    var self = this;
    var rtti = ['R','T1','T2','I']

    var headerTemp = '<div class="ngHeaderSortColumn {{col.headerClass}}" ng-style="{\'cursor\':col.cursor}" ng-class="{ \'ngSorted\': !noSortVisible }"> \
                            <div ng-click="col.sort($event)" ng-class="\'colt\' + col.index" class="ngHeaderText">{{col.displayName.name}}<br/>{{col.displayName.rttiType}}<br/>{{col.displayName.range}}</div> \
                            <div class="ngSortButtonDown" ng-show="col.showSortButtonDown()"></div><div class="ngSortButtonUp" ng-show="col.showSortButtonUp()"></div> \
                            <div class="ngSortPriority">{{col.sortPriority}}</div> \
                            <div ng-class="{ ngPinnedIcon: col.pinned, ngUnPinnedIcon: !col.pinned }" ng-click="togglePin(col)" ng-show="col.pinnable"></div> \
                     </div> \
                     <div ng-show="col.resizable" class="ngHeaderGrip" ng-click="col.gripClick($event)" ng-mousedown="col.gripOnMouseDown($event)"></div>';

    //var wizardCell = '<div class="wizardCell" ng-class="col.colIndex()"><a href="/#wizard/{{row.getProperty(col.field)}}"></a></div>';
    // var wizardCell = '<a href="/#wizard/{{row.getProperty(col.field)}}"><div class="wizardCell" ng-class="col.colIndex()"></div></a>';
    var wizardCell = '<div class="wizardCell" ng-class="col.colIndex()" ng-click="startWizard(row.getProperty(col.field))"></div>';


    $scope.myData = [];
    $scope.klas;
    $scope.proefwerk = [];

    $scope.myDefs = [{ field: 'name', displayName: { name: 'Opgave', rttiType: "R, T1, T2, I", range: 'Max'}, width: 200, headerCellTemplate : headerTemp }];
    $scope.myDefs.push({ field: 'number', displayName: '', width: 30, cellTemplate : wizardCell, sortable: false, enableCellEdit: false });

    $scope.gridOptions = {
        data: 'myData',
        columnDefs: 'myDefs',
        enableColumnResize: false,
        enableColumnReordering: false,
        selectedItems: $scope.mySelections,
        headerRowHeight: 70,
        enablePaging: true,
        enableRowSelection: true,
        multiSelect: false,
        enableRowReordering: false,
        enablePinning: false,
        showGroupPanel: false,
        showFooter: false,
        showFilter: true,
        enableCellEdit: true,
        enableCellSelection: true,
        showColumnMenu: false,
        maintainColumnRatios: true,
        primaryKey: 'id',
        sortInfo: {fields:['name'], directions:['asc'] }
    };
    
    $scope.filterOptions = {
        filterText: "",
        useExternalFilter: false
    };
 
    self.getPagedDataAsync = function (searchText) {
        //setTimeout(function () {
            self.gettingData = true;
            var data;
            if (searchText) {
                var ft = searchText.toLowerCase();
                data = testData.filter(function (item) {
                    return JSON.stringify(item).toLowerCase().indexOf(ft) != -1;
                });
            } else {
                data = testData;
            }
            $scope.myData = data;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            self.gettingData = false;
        //}, 100);
    };

    self.getKlas = function(proefwerk) {
         //get the klas
         dataFactory.getKlas()
            .success(function (klas) {
                  $scope.klas = klas;
                  //fill the testData with numbers for every opgave 
                  $.map(klas, function (leerlingEl, number) {   
                      row = {name: leerlingEl.naam, number: leerlingEl.id}
                      $.map(proefwerk, function(vraagEl) { 
                         row[vraagEl.id] = "0";
                      });
                      $scope.myData.push(row);
                  });

             })
             .error(function (error) {
                   console.log(error);
                   $scope.status = 'Unable to load klas: ' + error.message;
             });    
    }

    self.getData =  function() {

        dataFactory.getProefwerk()
             .success(function (proefwerk) {
                 $scope.proefwerk = proefwerk;
                 //fill definitions with proefwerk vragen
                 $.map(proefwerk, function(vraagEl) { 
                    $scope.myDefs.push({field: vraagEl.id, displayName: { name: vraagEl.id, rttiType: vraagEl.rtti, range: vraagEl.max }, width: 50, headerCellTemplate : headerTemp })                     
                 });

                 self.getKlas(proefwerk);   
  
             })
             .error(function (error) {
                console.log(error);
                 $scope.status = 'Unable to load proefwerk: ' + error.message;
             });
    }

    self.getData();

    $scope.startWizard = function (leerlingId) {
 
      var modalInstance = $modal.open({
        templateUrl: 'incl/wizard.html',
        scope: $scope,
        controller: 'ModalInstanceCtrl',
        resolve: {
          leerling: function() {
             return $.grep($scope.klas, function(e) { return e.id === leerlingId})[0];
          }
        }
      })

     };

    $scope.getRandomNumer = function (from, to) {
        return Math.floor(Math.random() * (to - from + 1) + from);
    };

    $scope.$watch('filterOptions', function () {
        if (!self.foInit || self.gettingData) {
            self.foInit = true;
            return;
        }
        self.getPagedDataAsync($scope.filterOptions.filterText);
    }, true);

    $scope.doStuff = function (evt) {
        var elm = angular.element(evt.currentTarget.parentNode);
        elm.on('change', function() {
            var scope = elm.scope();
            scope.$parent.isFocused = false;
        });
    };
  
});

rttiApp.controller('ModalInstanceCtrl', function($scope, $log, $timeout, $modalInstance, leerling) {
 
    var self = this;
   
    $scope.leerling = leerling;
    row = $scope.myData.filter( function (el) {return el.number == leerling.id})[0];
    $.map($scope.proefwerk, function(el) { row[el.id] = parseInt(row[el.id]) })

    $scope.uitslag = row;

 
    $scope.numbers = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
    $scope.counter = 0;
  
    $scope.slides = [{id: 5, vraag: 4, max: 10},{id: 6, vraag: 4, max: 10}];

    $scope.next = function() { 
        
        if($scope.proefwerk.length > $scope.counter) $scope.counter++;
        console.log("next:" + $scope.counter);
        $timeout(function() {
           $scope.$broadcast('focus' + $scope.counter); 
        },400);
    }

    $scope.previous = function() {
        if($scope.counter > 0) $scope.counter--;   
        $timeout(function() {
           $scope.$broadcast('focus' + $scope.counter); 
        },400);
    }

    $scope.ok = function () {
       $modalInstance.close();
    };

    $scope.cancel = function () {
       $modalInstance.dismiss();
    };

    $scope.handleKey = function() {
          alert('Im a event ');
    }
 
});

 var overwriteWithout = function(arr, item) {
    for(var i = arr.length; i >= 0; i--) {
      if(arr[i] === item) {
        arr.splice(i, 1);
      }
    }
  };

  var isUndefined = function(obj) {
    return obj === void 0;
  };

  
  var isSet = function(scope, expr){
    if(isUndefined(expr)){
      return false;
    }
    if(expr === ''){
      return true;
    }
    return scope.$eval(expr);
  };

rttiApp.factory('shortcuts', [
    '$document',
    function($document){
      var shortcuts = [];
      
      var charKeyCodes = {
        'delete': 8,
        'tab': 9,
        'enter': 13,
        'return': 13,
        'esc': 27,
        'space': 32,
        'left': 37,
        'up': 38,
        'right': 39,
        'down': 40,
        ';': 186,
        '=': 187,
        ',': 188,
        '-': 189,
        '.': 190,
        '/': 191,
        '`': 192,
        '[': 219,
        '\\': 220,
        ']': 221,
        "'": 222,
      };
      
      var inOrder = function(keys, initial){
        var len = keys.length;
        for(var i = 0; i < len; i++){
          charKeyCodes[keys[i]] = initial + i;
        }
      };
      
      inOrder('1234567890', 49);
      inOrder('abcdefghijklmnopqrstuvwxyz', 65);
      
      var keyCodeChars = {};
      $.map(charKeyCodes, function(keyCode, character){
        keyCodeChars[keyCode] = character;
      });
      
      var modifierKeys = {
        'shift': 'shift',
        'ctrl': 'ctrl',
        'meta': 'meta',
        'alt': 'alt'
      };
      
      var parseKeySet = function(keySet){
        var names = keySet.split('+');
        var keys = {};
        
        // Default modifiers to unset.
        $.map(modifierKeys, function(name){
          keys[name] = false;
        });
        
        $.map(names, function(name){
          var modifierKey = modifierKeys[name];
          if(modifierKey){
            keys[modifierKey] = true;
          }
          else {
            keys.keyCode = charKeyCodes[name];
            
            // In case someone tries for a weird key.
            if(!keys.keyCode){
              return;
            }
          }
        });
        
        return keys;
      };
      
      var parseEvent = function(e){
        var keys = {};
        keys.keyCode = charKeyCodes[keyCodeChars[e.which]];
        keys.meta = e.metaKey || false;
        keys.alt = e.altKey || false;
        keys.ctrl = e.ctrlKey || false;
        keys.shift = e.shiftKey || false;
        return keys;
      }
      
      var match = function(k1, k2){
        return (
          k1.keyCode === k2.keyCode &&
          k1.ctrl === k2.ctrl &&
          k1.alt === k2.alt &&
          k1.meta === k2.meta &&
          k1.shift === k2.shift
        );
      };
      
      $document.bind('keydown', function(e){
        // Don't catch keys that were in inputs.
        var $target = $(e.target);
        //if($target.is('input[type="text"], textarea')){
        //  return;
        //}
        
        var eventKeys = parseEvent(e);
        var shortcut;
        for(var i = shortcuts.length - 1; i >= 0; i--){
          shortcut = shortcuts[i];
          if(match(eventKeys, shortcut.keys)){
            e.preventDefault();
            
            // NOTE: the action is responsible for $scope.$apply!
            shortcut.action();
            return;
          }
        }
      });
      
      return {
        shortcuts: shortcuts,
        register: function(shortcut){
          shortcut.keys = parseKeySet(shortcut.keySet);
          
          // Be lenient.
          if(!shortcut.keys){
            return;
          }
          
          shortcuts.push(shortcut);
          return shortcut;
        },
        unregister: function(shortcut){
          overwriteWithout(shortcuts, shortcut);
        }
      };
    }
  ]);

rttiApp.directive('ngShortcut', [
    '$parse',
    'shortcuts',
    function($parse, shortcuts){
      return {
        restrict: 'A',
        link: function(scope, element, attrs){
          var shortcutKeySets = scope.$eval(attrs.ngShortcut);
          if(isUndefined(shortcutKeySets)){
            return;
          }
          shortcutKeySets = shortcutKeySets.split('|');
          
          var action;
          var eventAction = function(event){
            return function(){
              element.trigger(event);
            };
          };
          if(isSet(scope, attrs.ngShortcutClick)){
            action = eventAction('click');
          }
          else if(isSet(scope, attrs.ngShortcutFocus)){
            action = eventAction('focus');
          }
          else if(isSet(scope, attrs.ngShortcutFastClick)){
            // Since we are just triggering (not binding)
            // this works just fine.
            action = eventAction('click'); 
          }
          else if(attrs.ngShortcutNavigate){
            var url = scope.$eval(attrs.ngShortcutNavigate);
            action = function(){
              navigation.redirect(url, true);
            };
          }
          else if(attrs.ngShortcutAction){
            var fn = $parse(attrs.ngShortcutAction);
            action = function(){
              scope.$apply(function(){
                fn(scope);
              });
            };
          }
          
          $.map(shortcutKeySets, function(keySet){
            var shortcut = shortcuts.register({
              keySet: keySet,
              action: action,
              description: attrs.ngShortcutDescription || ''
            });
            scope.$on("$destroy", function(){
              shortcuts.unregister(shortcut);
            });
          });
        }
      }
    }]);

    rttiApp.directive('selectOnClick', function () {
        // Linker function
       return function (scope, element, attrs) {
        element.bind('click', function () {
           this.select();
         });
       };
    });

   rttiApp.directive('focusMe', function($timeout) {
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.focusMe, function(value) {
        if(value === true) { 
          console.log('value=',value);
          $timeout(function() {
            element[0].focus();
            element[0].select();
            scope[attrs.focusMe] = false;
          });
        }
      });
    }
  };
});




