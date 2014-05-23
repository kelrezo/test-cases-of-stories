Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'iteration',
    comboboxConfig: {
        fieldLabel: 'Select an Iteration:',
        labelWidth: 100,
        width: 300
    },
    
   onScopeChange: function() {
    var filter = this.getContext().getTimeboxScope().getQueryFilter();
    filter = filter.and({
        property: 'TestCaseStatus',
        operator: '<',
        value: 'ALL_RUN_ALL_PASSING'  
    });
    
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'UserStory',
            fetch: ['FormattedID','Name','TestCases', 'TestCaseStatus'],
            pageSize: 100,
            autoLoad: true,
            filters: [filter], 
            listeners: {
                load: this._onDataLoaded,
                scope: this
            }
        }); 
    },
    
     _onDataLoaded: function(store, data){
                var stories = [];
                var pendingTestCases = data.length;
                
                _.each(data, function(story) {
                            var s  = {
                                FormattedID: story.get('FormattedID'),
                                Name: story.get('Name'),
                                _ref: story.get("_ref"),
                                TestCaseCount: story.get('TestCases').Count,
                                TestCaseStatus: story.get('TestCaseStatus'),
                                TestCases: []
                            };
                            
                            var testcases = story.getCollection('TestCases', {fetch:['FormattedID','LastVerdict']});
                            testcases.load({
                                callback: function(records, operation, success){
                                    _.each(records, function(testcase){
                                        s.TestCases.push({_ref: testcase.get('_ref'),
                                                        FormattedID: testcase.get('FormattedID'),
                                                        Name: testcase.get('Name'),
                                                        LastVerdict: testcase.get('LastVerdict')
                                                    });
                                    }, this);
                                    
                                    --pendingTestCases;
                                    if (pendingTestCases === 0) {
                                        this._createGrid(stories);
                                    }
                                },
                                scope: this
                            });
                            stories.push(s);
                }, this);
    } ,            
    
    _createGrid: function(stories) {
        var myStore = Ext.create('Rally.data.custom.Store', {
                data: stories,
                pageSize: 100,  
            });
        if (!this.grid) {
        this.grid = this.add({
            xtype: 'rallygrid',
            itemId: 'mygrid',
            store: myStore,
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'TestCase Count', dataIndex: 'TestCaseCount'
                },
                {
                    text: 'Test Cases', dataIndex: 'TestCases', minWidth: 200,
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(testcase){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(testcase) + '">' + testcase.FormattedID + '</a>' + ' ' + testcase.LastVerdict);
                        });
                        return html.join('</br>');
                    }
                },
                {
                    text: 'TestCase Status', dataIndex: 'TestCaseStatus',minWidth: 200
                },
                
            ]
        });
         
         }else{
            this.grid.reconfigure(myStore);
         }
    }
});