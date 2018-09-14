   
var gui_base_object = {
    /**
     * Используется в шаблоне страницы
     */
    model : {
        selectedItems : {},
        /**
         * Переменная на основе пути к апи которая используется для группировки выделенных элементов списка
         * Чтоб выделение одного списка не смешивалось с выделением другого списка
         */
        selectionTag:"",
        guiFields:{}
    },
    getTemplateName : function (type, default_name)
    {
        var tpl = this.bulk_name + '_'+type
        if (!spajs.just.isTplExists(tpl))
        {
            if(default_name)
            {
                return default_name;
            }
            return 'entity_'+type
        }

        return tpl;
    },
    
    renderAllFields : function(opt)
    {
        let html = []
        for(let i in opt.fields)
        {
            html.push(this.renderField(opt.fields[i], opt))
        }

        let id =  getNewId();
        return JUST.onInsert('<div class="fields-block" id="'+id+'" >'+html.join("")+'</div>', () => {

            let fields = $('#'+id+" .gui-not-required")
            if(!this.view.hide_non_required || this.view.hide_non_required >= fields.length)
            {
                return;
            }

            fields.hide()
            $('#'+id).appendTpl(spajs.just.render('show_not_required_fields', {fields:fields, opt:opt}))
        })
    },

    /**
     * Отрисует поле при отрисовке объекта.
     * @param {object} field
     * @returns {html}
     */
    renderField : function(field, render_options)
    {
        if(!this.model.guiFields[field.name])
        {
            if(field.schema && field.schema.$ref)
            {
                var obj = getObjectBySchema(field.schema.$ref)
            }
            else if(field.$ref)
            {
                var obj = getObjectBySchema(field.$ref)

            }
            else if(field.items !== undefined && field.items.$ref)
            {
                var obj = getObjectBySchema(field.items.$ref)
            }

            if(obj)
            {
                var field_value = undefined
                if(this.model.data)
                {
                    field_value = this.model.data[field.name]
                }

                obj = new obj.one(undefined, field_value, this)

                this.model.guiFields[field.name] = obj
            }

            if(!this.model.guiFields[field.name])
            {
                var type = field.format

                if(!type && field.enum !== undefined)
                {
                    type = 'enum'
                }

                if(!type)
                {
                    type = field.type
                }

                if(!window.guiElements[type])
                {
                    type = "string"
                }

                var field_value = undefined
                if(this.model.data)
                {
                    field_value = this.model.data[field.name]
                }
                this.model.guiFields[field.name] = new window.guiElements[type](field, field_value, this)
            }

            // Добавление связи с зависимыми полями
            // if для хардкода на js
            if(field.dependsOn)
            {
                let thisField = this.model.guiFields[field.name]
                if(thisField.updateOptions)
                {
                    for(let i in field.dependsOn)
                    {
                        let parentField = this.model.guiFields[field.dependsOn[i]]
                        if(parentField && parentField.addOnChangeCallBack)
                        {
                            parentField.addOnChangeCallBack(function(){
                                thisField.updateOptions.apply(thisField, arguments);
                            })
                        }
                    }
                }
            }

            // if для привязанных полей из api
            if(field.additionalProperties && field.additionalProperties.field)
            {
                let thisField = this.model.guiFields[field.name];
                let parentField = this.model.guiFields[field.additionalProperties.field];

                if(parentField && parentField.addOnChangeCallBack)
                {
                    parentField.addOnChangeCallBack(function() {
                        thisField.updateOptions.apply(thisField, arguments);
                    })
                }
            }

        }

        return this.model.guiFields[field.name].render($.extend({}, render_options))
    },

    /**
     * Получает значения всех полей из this.model.guiFields
     *
     * @returns {basePageView.getValue.obj}
     */
    getValue : function ()
    {
        var obj = {}
        let count = 0;
        for(let i in this.model.guiFields)
        {
            let val = this.model.guiFields[i].getValidValue();
            if(val !== undefined)
            {
                obj[i] = val;
            }

            count++;
        }

        if(count == 1 && this.model.guiFields[0] )
        { 
            obj = obj[0]
        }

        return obj;
    },

    /**
     * Вернёт значение только правильное, если оно не правильное то должно выкинуть исключение 
     */
    getValidValue : function ()
    { 
        return this.getValue();
    },

}
 
function guiObjectFactory(api_object)
{
    
    let arr = [{}, window.gui_base_object]
    if(window["gui_"+api_object.type+"_object"])
    {
        arr.push(window["gui_"+api_object.type+"_object"])
    }
    
    if(api_object.extension_class_names)
    {
        for(let i in api_object.extension_class_names)
        {
            if(api_object.extension_class_names[i] && window[api_object.extension_class_name[i]])
            {
                arr.push(window[api_object.extension_class_name[i]])
            }
        } 
    }
    
    arr.push({api:api_object}) 
    let res = $.extend.apply($, arr) 
    res.init.apply(res, arguments) 
    
    return res;
}
 









































function emptyAction(action_info)
{
    let name = action_info.api_path.match(/\/([A-z0-9]+)\/$/); 
    if(!name || !name[1])
    {
        return undefined
    }
 
    let actionCalass = guiActionFactory(window.api, {action:action_info.api_path_value, api_path:action_info.api_path, name:name[1]})
    let action = new actionCalass({api:action_info.api_path_value, url:spajs.urlInfo.data.reg})
    
    return function(){
        action.exec() 
    }
}

/**
 * Выполняет переход на страницу с результатами поиска
 * Урл строит на основе того какая страница открыта.
 *
 * @param {string} query
 * @returns {$.Deferred}
 */
function goToSearch(obj, query)
{
    if (obj.isEmptySearchQuery(query))
    {
        spajs.openURL(spajs.urlInfo.data.reg.baseURL());
    }

    return spajs.openURL(spajs.urlInfo.data.reg.searchURL(obj.searchObjectToString(trim(query))));
}

function deleteAndGoUp(obj)
{
    var def = obj.delete();
    $.when(def).done(function(){
        var upper_url = spajs.urlInfo.data.reg.baseURL().replace(/\/\d+$/g, '');
        spajs.openURL(upper_url);
    })

    return def;
}

function createAndGoEdit(obj)
{
    var def = obj.create();
    $.when(def).done(function(newObj){

        spajs.openURL(spajs.urlInfo.data.reg.baseURL(newObj.data.id));
    })

    return def;
}

function goToMultiAction(ids, action)
{
    return spajs.openURL(window.hostname + "?" + spajs.urlInfo.data.reg.page_and_parents+"/"+ids.join(",")+"/"+action);
}

function goToMultiActionFromElements(elements, action)
{
    let ids = window.guiListSelections.getSelectionFromCurrentPage(elements);

    return goToMultiAction(ids, action)
}

function addToParentsAndGoUp(item_ids)
{
    return $.when(changeSubItemsInParent('POST', item_ids)).done(function (data)
    {
        spajs.openURL(window.hostname + spajs.urlInfo.data.reg.baseURL());
    }).fail(function (e)
    {
        polemarch.showErrors(e.responseJSON)
    }).promise();
}

/**
 * Для добавления и удаления подэлементов в списке
 * @param {array} item_ids
 * @returns {promise}
 */
function changeSubItemsInParent(action, item_ids)
{
    var def = new $.Deferred();
    if(!item_ids || item_ids.length == 0)
    {
        def.resolve()
        return def.promise();
    }

    let parent_id = spajs.urlInfo.data.reg.parent_id
    let parent_type = spajs.urlInfo.data.reg.parent_type
    let item_type = spajs.urlInfo.data.reg.page_type

    //var url = "/api/v2/" + parent_type +"/" + parent_id +"/" + item_type +"/"

    var parent = window["api"+parent_type]
    if(!parent)
    {
        console.error("Error parent object not found")
        debugger;
        def.resolve()
        return def.promise();
    }

    if(!parent_id)
    {
        console.error("Error parent_id not found")
        debugger;
        def.resolve()
        return def.promise();
    }

    var item = window["api"+item_type]
    if(!item)
    {
        console.error("Error item_type not found")
        debugger;
        def.resolve()
        return def.promise();
    }

    //  @todo отправка запроса чего то не работает. Надо сергея спросить.
    let query = []
    for(let i in item_ids)
    {
        query.push({
            type: "mod",
            data_type:item_type,
            item:parent_type,
            data:{id:item_ids[i]/1},
            pk:parent_id,
            method:action
        })
    }

    return api.query(query) 
}


function getUrlBasePath()
{
    return window.location.search.replace(/\/$/, "")
}

function renderErrorAsPage(error)
{
    return spajs.just.render('error_as_page', {error:error, opt: {}});
}

function isEmptyObject(obj)
{
    if(!obj)
    {
        return true;
    }
    
    return Object.keys(obj).length == 0
}

function questionForAllSelectedOrNot(selection_tag, action_name){
    var answer;
    var question = "Apply action <b>'"+ action_name + "'</b> for elements only from this page or for all selected elements?";
    var answer_buttons = ["For this page's selected", "For all selected"];
    $.when(guiPopUp.question(question, answer_buttons)).done(function(data){
        answer = data;
        if($.inArray(answer, answer_buttons) != -1)
        {
            if(answer == answer_buttons[0])
            {
                goToMultiActionFromElements($('.multiple-select .item-row.selected'), action_name );
            }
            else
            {
                goToMultiAction(selection_tag, action_name);
            }
        }
    });

    return false;
}

function questionDeleteAllSelectedOrNot(thisObj) {
    var answer;
    var question = "Apply action <b> 'delete' </b> for elements only from this page or for all selected elements?";
    var answer_buttons = ["For this page's selected", "For all selected"];

    $.when(guiPopUp.question(question, answer_buttons)).done(function(data){
        answer = data;
        if($.inArray(answer, answer_buttons) != -1)
        {
            let ids;
            let tag = thisObj.model.selectionTag;
            if(answer == answer_buttons[0])
            {
                ids = window.guiListSelections.getSelectionFromCurrentPage($('.multiple-select .item-row.selected'));
                deleteSelectedElements(thisObj, ids, tag);
            }
            else
            {
                ids = window.guiListSelections.getSelection(tag);
                deleteSelectedElements(thisObj, ids, tag);
            }
        }
    });

    return false;
}

function questionDeleteOrRemove(thisObj){
    var answer;
    var question = "<b> Delete </b> selected elements at all or just <b> remove </b> them from this list?";
    var answer_buttons = ["Delete this page's selected", "Delete all selected", "Remove this page's selected", "Remove all selected"];

    $.when(guiPopUp.question(question, answer_buttons)).done(function(data){
        answer = data;
        if($.inArray(answer, answer_buttons) != -1)
        {
            let ids;
            let tag = thisObj.model.selectionTag;
            switch(answer)
            {
                case answer_buttons[0]:
                    ids = window.guiListSelections.getSelectionFromCurrentPage($('.multiple-select .item-row.selected'));
                    deleteSelectedElements(thisObj, ids, tag);
                    break;
                case answer_buttons[1]:
                    ids = window.guiListSelections.getSelection(tag);
                    deleteSelectedElements(thisObj, ids, tag);
                    break;
                case answer_buttons[2]:
                    ids = window.guiListSelections.getSelectionFromCurrentPage($('.multiple-select .item-row.selected'));
                    removeSelectedElements(ids, tag);
                    break;
                case answer_buttons[3]:
                    ids = window.guiListSelections.getSelection(tag);
                    removeSelectedElements(ids, tag);
                    break;
            }
        }
    });

    return false;
}

/**
 * Функция удаляет элементы, id которых перечислены в массиве ids
 * (могут быть как все выделенные элементы, так и только элементы с текущей страницы).
 */
function deleteSelectedElements(thisObj, ids, tag){
    window.guiListSelections.unSelectAll(tag);

    for(let i in ids)
    {
        $(".item-row.item-"+ids[i]).remove()
    }

    $.when(thisObj.deleteArray(ids)).done(function(d)
    {

    }).fail(function (e)
    {
        polemarch.showErrors(e.responseJSON)
        debugger;
    })

    return false;
}


/**
 * Функция убирает из списка (но не удаляет совсем) элементы, id которых перечислены в массиве ids
 * (могут быть как все выделенные элементы, так и только элементы с текущей страницы).
 */
function removeSelectedElements(ids, tag) {
    $.when(changeSubItemsInParent('DELETE', ids)).done(function()
    {
        window.guiListSelections.unSelectAll(tag);
        debugger;
        spajs.openURL(window.hostname + spajs.urlInfo.data.reg.page_and_parents);
    }).fail(function (e)
    {
        polemarch.showErrors(e.responseJSON)
        debugger;
    })

    return false;
}