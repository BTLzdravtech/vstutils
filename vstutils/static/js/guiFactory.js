
function getMenuIdFromApiPath(path){
    return path.replace(/[^A-z0-9\-]/img, "_")+Math.random()
}


function openApi_definitions(api)
{
    // Создали фабрику для всего
    for(var key in api.openapi.definitions)
    {
        var one;
        var list;

        if(window["api"+key])
        {
            continue;
        }

        if(/^One/.test(key))
        {
            one = api.openapi.definitions[key]
            list = api.openapi.definitions[key.replace(/^One/, "")]
        }
        else
        {
            one = api.openapi.definitions["One"+key]
            list = api.openapi.definitions[key]
        }


        console.log("Фабрика", key.replace(/^One/, ""));

        if(!one)
        {
            one = list;
        }

        if(!list)
        {
            list = one;
        }


        var list_fileds = []
        for(var i in list.properties)
        {
            if($.inArray(i, ['url', 'id']) != -1)
            {
                continue;
            }

            var val = list.properties[i]
            val.name = i


            list_fileds.push(val)
        }

        var one_fileds = []
        for(var i in one.properties)
        {
            if($.inArray(i, ['url', 'id']) != -1)
            {
                continue;
            }

            var val = one.properties[i]
            val.name = i


            one_fileds.push(val)
        }

        window["api"+key] = guiItemFactory(api, {
            view:{
                bulk_name:key.toLowerCase().replace(/^One/i, ""),
                definition:list,
                class_name:"api"+key,
                page_size:20,
            },
            model:{
                fileds:list_fileds,
                page_name:key.toLowerCase().replace(/^One/i, ""),
            }
        }, {
            view:{
                bulk_name:key.toLowerCase().replace(/^One/i, ""),
                definition:one,
                class_name:"api"+key,
            },
            model:{
                fileds:one_fileds,
                page_name:key.toLowerCase().replace(/^One/i, ""),
            }
        })

        /**
         *  Событие в теле которого можно было бы переопределить поля фабрики сразу после её создания
         *
         *  На пример такой код для объекта типа Group будет добавлять поле testData
         *   tabSignal.connect("openapi.factory.Group", function(data)
         *   {
         *      data.testData = "ABC";
         *   })
         */
        tabSignal.emit("openapi.factory."+key,  {obj:window["api"+key], name:"api"+key});
    }
}

function getUrlInf(url_reg){
    if(!url_reg)
    {
        url_reg = spajs.urlInfo.data.reg
    }

            // Поиск и списки:
            // При таком построении регулярок:
            //  - параметры поиска в блоке 4
            //  - тип страницы в блоке 3
            //  - цепочка родителей в блоке 2
            //  - страница+родители в блоке 1
            //  - текущий урл в блоке 0

    return {
        url:url_reg[0],
        search:url_reg[4],
        page_type:url_reg[3],
        page_and_parents:url_reg[1],
    }
}

function guiTestUrl(regexp, url)
{
    var reg_exp = new RegExp(regexp)
    if(!reg_exp.test(url))
    {
        return false;
    }

    return reg_exp.exec(url)
}

/**
 * Ищет описание схемы в объекте рекурсивно
 * @param {object} obj
 * @returns {undefined|object}
 */
function getObjectBySchema(obj)
{
    if(!obj)
    {
        return undefined;
    }

    if(typeof obj == 'string')
    {
        var name = obj.match(/\/([A-z0-9]+)$/)
        if(name && name[1])
        {
            name = window["api" + name[1] ]
            if(name)
            {
                return name;
            }
        }
        return undefined;
    }

    if(typeof obj != 'object')
    {
        return undefined;
    }

    for(var i in obj)
    {
        if(i == '$ref')
        {
            var name = obj[i].match(/\/([A-z0-9]+)$/)

            if(name && name[1])
            {
                name = window["api" + name[1] ]
                if(name)
                {
                    return name;
                }
            }
        }

        if(typeof obj[i] == 'object')
        {
            name = getObjectBySchema(obj[i])
            if(name)
            {
                return name;
            }
        }
    }

    return undefined;
}

/**
 * Вернёт массив actions для пути base_path
 * @param {type} api апи
 * @param {type} base_path путь в апи
 * @returns {Array|openApi_actions_paths.res} экшены этого пути
 */
function openApi_get_actions_paths(api, base_path)
{
    if(!api.openapi["paths"][base_path].get)
    {
        return []
    }

    var base_operationId = api.openapi["paths"][base_path].get.operationId.replace(/_get$/, "");

    var res = []
    // Список Actions строить будем на основе данных об одной записи.
    for(var api_action_path in api.openapi.paths)
    {
        var api_path_value = api.openapi.paths[api_action_path]

        if(api_path_value.get )
        {
            // это не экшен
            continue;
        }

        var count = 0;
        var base_url = ""
        for(var i=0; i< api_action_path.length && i< base_path.length; i++)
        {
            if(api_action_path[i] == base_path[i])
            {
                count++;
                base_url+= api_action_path[i]
            }
            else
            {
                break;
            }
        }

        if(count <  base_path.length)
        {
            continue;
        }

        var operationId = false
        if(api_path_value.post )
        {
            operationId = api_path_value.post.operationId
        }
        if(api_path_value.delete )
        {
            operationId = api_path_value.delete.operationId
        }
        if(api_path_value.put )
        {
            operationId = api_path_value.put.operationId
        }

        if(!operationId)
        {
            debugger;
            continue;
        }

        let dif = api_action_path.match(/\//g).length - base_path.match(/\//g).length;

        // level = 1 это экшены для пути
        // level = 2 это экшены для близжайшего вложенного элемента
        if(dif != 1)
        {
            continue;
        }

        var name = api_action_path.match(/\/([A-z0-9]+)\/$/)

        res.push({path:api_action_path, level:dif, name:name[1], action:api_path_value})
    }

    return res;
}

function openApi_add_one_action_page_path(api, api_path, pageMainBlockObject, action)
{
    // Создали страницу
    var page = new guiPage();

    // Настроили страницу
    page.blocks.push({
        id:'actionOne',
        prioritet:10,
        render:function(action)
        {
            return function(menuInfo, data)
            { 
                // Создали список хостов
                var pageAction = new action(data.reg)
  
                return pageAction.renderAsPage();
            }
        }(action)
    })

    // Страница элемента вложенного куда угодно
    var regexp_in_other = function(regexp)
            {
                return function(url)
                {
                    var res = guiTestUrl(regexp, url)
                    if(!res)
                    {
                        return false;
                    }

                    var obj = {
                        url:res[0],                 // текущий урл в блоке
                        page_type:res[2],           // тип страницы в блоке
                        page_and_parents:res[0],    // страница+родители
                        parents:res[1],
                        id:res[3],
                        action:res[4],
                    }

                    if(obj.parents)
                    {
                        var match = obj.parents.match(/([A-z]+)\/([0-9]+)\/$/)

                        if(match && match[1] && match[2] && match[2])
                        {
                            obj.parent_type = match[1]
                            obj.parent_id = match[2]
                        }
                    }

                    obj.baseURL = function(){
                        if(this.parents)
                        {
                            return "/?"+this.parents;
                        }

                        return "/?"+this.page_type;
                    }
                    
                    return obj
                }
            }("^([A-z]+\\/[0-9]+\\/)*("+pageMainBlockObject.one.view.bulk_name+")\\/([0-9]+)\\/("+action.view.name+")$");

    page.registerURL([regexp_in_other], getMenuIdFromApiPath(api_path));
}

function openApi_add_one_page_path(api, api_path, pageMainBlockObject, urlLevel)
{
    // Создали страницу
    var page = new guiPage();

    // Список Actions строить будем на основе данных об одной записи.
    var api_actions = openApi_get_actions_paths(api, api_path);
    if(api_actions.length)
    {
        //console.log(api_path)
        //console.table(api_actions)

        for(var i in api_actions)
        {
            var object_action = api_actions[i]
            if(object_action.level != 1)
            {
                continue;
            }
     
            if(pageMainBlockObject.one.actions[object_action['name']] === undefined)
            {
                var action = guiActionFactory(api, pageMainBlockObject, object_action)
                pageMainBlockObject.one.actions[object_action['name']] = action

                openApi_add_one_action_page_path(api, api_path, pageMainBlockObject, action)
            }

        }
    }

    // Настроили страницу
    page.blocks.push({
        id:'itemOne',
        prioritet:0,
        render:function(pageMainBlockObject)
        {
            return function(menuInfo, data)
            {
                var objId = data.reg.id

                // Создали список хостов
                var pageItem = new pageMainBlockObject.one()

                var def = new $.Deferred();
                $.when(pageItem.load(objId)).done(function()
                {
                    def.resolve(pageItem.renderAsPage())
                }).fail(function(err)
                {
                    def.resolve(renderErrorAsPage(err));
                })

                return def.promise();
            }
        }(pageMainBlockObject)
    })

    // Страница элемента вложенного куда угодно
    var regexp_in_other = function(regexp)
            {
                return function(url)
                {
                    var res = guiTestUrl(regexp, url)
                    if(!res)
                    {
                        return false;
                    }

                    var obj = {
                        url:res[0],                 // текущий урл в блоке
                        page_type:res[2],           // тип страницы в блоке
                        page_and_parents:res[0],    // страница+родители
                        parents:res[1],
                        id:res[3]
                    }

                    if(obj.parents)
                    {
                        var match = obj.parents.match(/([A-z]+)\/([0-9]+)\/$/)

                        if(match && match[1] && match[2] && match[2])
                        {
                            obj.parent_type = match[1]
                            obj.parent_id = match[2]
                        }
                    }

                    obj.baseURL = function(){
                        if(this.parents)
                        {
                            return "/?"+this.parents;
                        }

                        return "/?"+this.page_type;
                    }

                    return obj
                }
            }("^([A-z]+\\/[0-9]+\\/)*("+pageMainBlockObject.one.view.bulk_name+")\\/([0-9]+)$");

    page.registerURL([regexp_in_other], getMenuIdFromApiPath(api_path));
}

function openApi_add_list_page_path(api, api_path, pageMainBlockObject, urlLevel)
{
    
    // Создали страницу
    var page = new guiPage();

    var path_regexp = []
    var api_path_value = api.openapi.paths[api_path]

    path_regexp.push(function(regexp)
            {
                return function(url)
                {
                    var res = guiTestUrl(regexp, url)
                    if(!res)
                    {
                        return false;
                    }

                    var obj = {
                        url:res[0],                 // текущий урл в блоке
                        page_type:res[3],           // тип страницы в блоке
                        page_and_parents:res[1],    // страница+родители
                        parents:res[2],
                        search_part:res[4],         // параметры поиска
                        search_query:res[5],        // параметры поиска
                        page_number_part:res[6],
                        page_number:res[7],
                    }

                    if(res[1])
                    {
                        var match = res[1].match(/([A-z]+)\/([0-9]+)\/([A-z]+)$/)

                        if(match && match[1] && match[2] && match[2])
                        {
                            obj.parent_type = match[1]
                            obj.parent_id = match[2]
                        }
                    }

                    obj.searchURL = function(query){
                        return "/?"+this.page_and_parents+"/search/"+query;
                    }

                    obj.baseURL = function(){
                        return "/?"+this.page_and_parents;
                    }

                    return obj
                }
            }("^(([A-z]+\\/[0-9]+\\/)*("+pageMainBlockObject.one.view.bulk_name+"))(\\/search\\/([A-z0-9 %\-.:,=]+)){0,1}(\\/page\\/([0-9]+)){0,1}$"))

    if(api_path == "/inventory/{pk}/variables/")
    {
        debugger;
    }
    // Поля для поиска
    api_path_value.parameters

    // Проверяем есть ли возможность создавать объекты
    if(api_path_value.post)
    {

        // Страница нового объекта создаваться должна на основе схемы пост запроса а не на основе схемы списка объектов.
        // parameters[0].schema.$ref
        var pageNewObject = getObjectBySchema(api_path_value.post)
        if(!pageNewObject)
        {
            debugger;
            console.error("Not valid schema, @todo")
        }

        // Значит добавим кнsопку создать объект
        page.blocks.push({
            id:'btn-create',
            prioritet:9,
            render:function(pageMainBlockObject)
            {
                return function(menuInfo, data)
                {
                    var link = "//"+window.location.host+"?"+data.reg.page_and_parents+"/new";

                    var btn = new guiElements.link_button({
                        class:'btn btn-primary',
                        link: link,
                        title:'Create new '+pageMainBlockObject.one.view.bulk_name,
                        text:'Create',
                    })

                    var def = new $.Deferred();
                    def.resolve(btn.render())
                    return def.promise();
                }
            }(pageMainBlockObject)
        })

        // Если есть кнопка создать объект то надо зарегистрировать страницу создания объекта
        var new_page_url = function(regexp)
            {
                return function(url)
                {
                    var res = guiTestUrl(regexp, url)
                    if(!res)
                    {
                        return false;
                    }

                    var obj = {
                        url:res[0],                 // текущий урл в блоке
                        page_type:res[2],           // тип страницы в блоке
                        page_and_parents:res[0],    // страница+родители
                        parents:res[1],
                    }

                    if(obj.page_and_parents)
                    {
                        var match = obj.page_and_parents.match(/([A-z]+)\/([0-9]+)\/([A-z]+)$/)

                        if(match && match[1] && match[2] && match[2])
                        {
                            obj.parent_type = match[1]
                            obj.parent_id = match[2]
                        }
                    }

                    obj.baseURL = function(id){

                        var url = "/?"+this.page_type
                        if(this.parents)
                        {
                            url = "/?"+this.parents;
                        }

                        if(id)
                        {
                            url+= '/'+id
                        }

                        return url;
                    }

                    return obj
                }
            }("^([A-z]+\\/[0-9]+\\/)*("+pageMainBlockObject.one.view.bulk_name+")\\/new$")

        // Создали страницу
        var page_new = new guiPage();
        page_new.registerURL([new_page_url], getMenuIdFromApiPath(api_path+"_new"));


        //    debugger;

        // Настроили страницу нового элемента
        page_new.blocks.push({
            id:'newItem',
            prioritet:10,
            render:function(pageNewObject)
            {
                return function(menuInfo, data)
                {
                    var def = new $.Deferred();

                    var pageItem = new pageNewObject.one()
                    def.resolve(pageItem.renderAsNewPage())

                    return def.promise();
                }
            }(pageNewObject)
        })
    }

    // Настроили страницу списка
    page.blocks.push({
        id:'itemList',
        prioritet:10,
        render:function(pageMainBlockObject)
        {
            return function(menuInfo, data)
            {
                var def = new $.Deferred();

                // Создали список хостов
                var pageItem = new pageMainBlockObject.list()

                // Определили фильтр
                var filters = {}
                filters.limit = 20
                filters.ordering = 'desc'
                filters.query = data.reg.search_query


                if(data.reg.page_number)
                {
                    filters.offset = (data.reg.page_number-1) * 20
                }

                filters.parent_type = data.reg.parent_type
                filters.parent_id = data.reg.parent_id

                $.when(pageItem.search(filters)).done(function()
                {
                    def.resolve(pageItem.renderAsPage())
                }).fail(function(err)
                {
                    def.reject(err);
                })

                return def.promise();
            }
        }(pageMainBlockObject)
    })

    //debugger;
    //break;
    page.registerURL(path_regexp, getMenuIdFromApiPath(api_path));
}

function openApi_getPageMainBlockType(api, api_path, urlLevel)
{
    var api_path_value = api.openapi.paths[api_path]

    // Определяем какой класс соответсвует урлу
    var pageMainBlockType = api_path.replace(/\{[A-z]+\}\/$/, "").match(/\/([A-z0-9]+)\/$/)

    if(!pageMainBlockType || !pageMainBlockType[1])
    {
        debugger;
        return false;
    }

    // Получаем класс по имени
    // Сначала путём определения соответсвия имён урла и класса
    var pageMainBlockObject= window["api" + pageMainBlockType[1][0].toUpperCase() + pageMainBlockType[1].substr(1) ]
    if(!pageMainBlockObject)
    {
        // Если не нашли на прямую то через соответсвие имени схемы в полях класса
        try{
            // Получаем класс по имени схемы из урла
            pageMainBlockType = api_path_value.get.responses[200].schema.$ref.match(/\/([A-z0-9]+)$/)
        }
        catch (exception)
        {
            try{
                // Получаем класс по имени схемы из урла
                pageMainBlockType = api_path_value.get.responses[200].schema.properties.results.items.$ref.match(/\/([A-z0-9]+)$/)
            }
            catch (exception)
            {
                try
                {
                    // Получаем класс по имени схемы из урла
                    pageMainBlockType = api_path_value.post.responses[201].schema.$ref.match(/\/([A-z0-9]+)$/)
                }
                catch (exception)
                {
                    try
                    {
                        // Получаем класс по имени схемы из урла
                        pageMainBlockType = api_path_value.put.responses[201].schema.$ref.match(/\/([A-z0-9]+)$/)
                    }
                    catch (exception)
                    {
                        console.warn("Нет схемы у "+api_path)
                        //debugger;
                        return false;
                    }
                }
            }
        }

        if(!pageMainBlockType || !pageMainBlockType[1])
        {
            debugger;
            return false;
        }

        pageMainBlockObject= window["api" + pageMainBlockType[1] ]
        if(!pageMainBlockObject)
        {
            // Получаем класс по имени
            pageMainBlockObject= window["api" + pageMainBlockType[1].replace(/^One/, "") ]
            if(!pageMainBlockObject)
            {
                debugger;
                return false;
            }
        }

        // Если нашли соответсвие по схеме отправляемых данных то выставим правильный bulk_name
        if(urlLevel <= 2)
        {
            pageMainBlockObject.one.view.bulk_name = api_path.replace(/[\/]/img, "");
            pageMainBlockObject.list.view.bulk_name = api_path.replace(/[\/]/img, "");
        }
    }

    return pageMainBlockObject;
}

function openApi_paths(api)
{
    for(var api_path in api.openapi.paths)
    {
        var api_path_value = api.openapi.paths[api_path]

        // Лучше проверять тип страницы по api.openapi["paths"]["/group/"].get.operationId
        // Если *_list это список
        // Если *_get это страница
        // В остальных случаях экшен

        if(!api_path_value.get )
        {
            // это экшен
            continue;
        }

        // Уровень вложености меню (по идее там где 1 покажем в меню с лева)
        var urlLevel = (api_path.match(/\//g) || []).length

        var pageMainBlockObject = openApi_getPageMainBlockType(api, api_path, urlLevel)
        if(pageMainBlockObject == false)
        {
            continue;
        }

        // Определяем тип страницы из урла (список или один элемент)
        // Один элемент заканчивается на его идентификатор
        if(!/\{[A-z_\-]+\}\/$/.test(api_path))
        {
            continue;
        }

        // это один элемент
        openApi_add_one_page_path(api, api_path, pageMainBlockObject, urlLevel)
    }
    
    var listPath = []
    for(var api_path in api.openapi.paths)
    {
        var api_path_value = api.openapi.paths[api_path]

        // Лучше проверять тип страницы по api.openapi["paths"]["/group/"].get.operationId
        // Если *_list это список
        // Если *_get это страница
        // В остальных случаях экшен

        if(!api_path_value.get )
        {
            // это экшен
            continue;
        }

        // Уровень вложености меню (по идее там где 1 покажем в меню с лева)
        var urlLevel = (api_path.match(/\//g) || []).length

        var pageMainBlockObject = openApi_getPageMainBlockType(api, api_path, urlLevel)
        if(pageMainBlockObject == false)
        {
            continue;
        }

        // Определяем тип страницы из урла (список или один элемент)
        // Один элемент заканчивается на его идентификатор
        if(/\{[A-z_\-]+\}\/$/.test(api_path))
        {
            continue;
        }
        listPath.push(api_path)
        // это список
        openApi_add_list_page_path(api, api_path, pageMainBlockObject, urlLevel)
    }
    
    console.table(listPath)
}

tabSignal.connect("resource.loaded", function()
{
    window.api = new guiApi()
    $.when(window.api.init()).done(function(){

        // Событие в теле которого можно было бы переопределить ответ от open api
        tabSignal.emit("openapi.loaded",  {api: window.api});

        openApi_definitions(window.api)

        /**
         * Событие в теле которого можно было бы переопределить отдельные методы для классов апи
         * tabSignal.connect("openapi.definitions", function()
            {
                // Переопределили метод render у фабрики хостов
               window.apiHost.one.render = function(){ alert("?!")}
            })
         */
        tabSignal.emit("openapi.definitions",  {api: window.api});

        openApi_paths(window.api);

        // Событие в теле которого можно было бы переопределить и дополнить список страниц
        tabSignal.emit("openapi.paths",  {api: window.api});

        tabSignal.emit("openapi.completed",  {api: window.api});
        tabSignal.emit("loading.completed");
    })
})





























/*
 * Это исключение. Так как при парсинге урлов и описаний не верно выставился bulk_name у класса OneOwner
 */
tabSignal.connect("openapi.factory.OneOwner", function(obj)
{
    window[obj.name].one.view.bulk_name = "user";
    window[obj.name].list.view.bulk_name = "user";

})

tabSignal.connect("openapi.factory.Variable", function(obj)
{
    window[obj.name].one.view.bulk_name = "variables";
    window[obj.name].list.view.bulk_name = "variables";

})