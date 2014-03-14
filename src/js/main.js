/// <reference path="../plugins/ng-grid-reorderable.js" />
/// <reference path="../ng-grid-1.0.0.debug.js" />

var rttiApp = angular.module('rttiApp', ['ngGrid']);

//Define Routing for app
//Uri /             -> template grid.html and Controller GridController
//Uri /wizard       -> template wizard.html and Controller WizardController
rttiApp.config(['$routeProvider',
  function($routeProvider) {
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
}]);


rttiApp.controller('GridController', function($scope) {
    console.log("GridController");
    var self = this;
    var rtti = ['R','T1','T2','I']

    $scope.myData = [];
    $scope.myDefs = [];

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

    

    var headerTemp = '<div class="ngHeaderSortColumn {{col.headerClass}}" ng-style="{\'cursor\':col.cursor}" ng-class="{ \'ngSorted\': !noSortVisible }"> \
                            <div ng-click="col.sort($event)" ng-class="\'colt\' + col.index" class="ngHeaderText">{{col.displayName.name}}<br/>{{col.displayName.rttiType}}<br/>{{col.displayName.range}}</div> \
                            <div class="ngSortButtonDown" ng-show="col.showSortButtonDown()"></div><div class="ngSortButtonUp" ng-show="col.showSortButtonUp()"></div> \
                            <div class="ngSortPriority">{{col.sortPriority}}</div> \
                            <div ng-class="{ ngPinnedIcon: col.pinned, ngUnPinnedIcon: !col.pinned }" ng-click="togglePin(col)" ng-show="col.pinnable"></div> \
                     </div> \
                     <div ng-show="col.resizable" class="ngHeaderGrip" ng-click="col.gripClick($event)" ng-mousedown="col.gripOnMouseDown($event)"></div>';

    //var wizardCell = '<div class="wizardCell" ng-class="col.colIndex()"><a href="/#wizard/{{row.getProperty(col.field)}}"></a></div>';
     var wizardCell = '<a href="/#wizard/{{row.getProperty(col.field)}}"><div class="wizardCell" ng-class="col.colIndex()"></div></a>';


    $scope.myDefs = [{ field: 'name', displayName: { name: 'Opgave', rttiType: "R, T1, T2, I", range: 'Max'}, width: 200, headerCellTemplate : headerTemp }];
    $scope.myDefs.push({ field: 'number', displayName: '', width: 30, cellTemplate : wizardCell, sortable: false, enableCellEdit: false })
    for (var i = 1; i < 20; i++) {
       $scope.myDefs.push({field: 'opg' + i.toString(), aap: "aap", displayName: { name: i.toString(), rttiType: rtti[$scope.getRandomNumer(0,3)], range: $scope.getRandomNumer(0,10) }, width: 50, headerCellTemplate : headerTemp }) 
    };

    var testData = [];
    var leerlingen = 
      ["Breemhaar, Frederique", 
       "Broek, Ron",
       "Broeke, Kees", 
       "Achmed, Cazemier",
       "Cornelis, Jaap",
       "Boginskaja, Svetlana",
       "Kutyr, Sergey",
       "Heummen, Satya van",
       "Dzmitry, Bushenko",
       "Bouwhuis, Nienke",
       "Kramer, Sven",
       "Oosterhof, Elia",
       "Harks, John",
       "Dekker, Melissa",
       "Reitsma, Peter"]; 

    $.map(leerlingen, function (val, number) {   
        el = {name: val};
        el['number'] = number;
        for (var i = 1; i < 20; i++) {
            el['opg' + i.toString()] = $scope.getRandomNumer(0,10);
        } 
        testData.push(el);
     });

    $scope.testme = function (number) {
        alert('starten die wizard numer ' + number );
    };

    $scope.doStuff = function (evt) {
        var elm = angular.element(evt.currentTarget.parentNode);
        elm.on('change', function() {
            var scope = elm.scope();
            scope.$parent.isFocused = false;
        });
    };

    self.getPagedDataAsync($scope.filterOptions.filterText);
  
});

rttiApp.controller('WizardController', function($scope) {
 
    $scope.message = 'This is Wizard screen';
 
});