
// Если количество не обязательных полей больше или равно чем hide_non_required то они будут спрятаны
guiLocalSettings.setIfNotExists('hide_non_required', 4)

// Количество элементов на странице
guiLocalSettings.setIfNotExists('page_size', 20)


function getMenuIdFromApiPath(path){
    return path.replace(/[^A-z0-9\-]/img, "_")//+Math.random()
}

function guiTestUrl(regexp, url)
{
    url = url.replace(/[/#]*$/, "").replace(/^\//, "")
    var reg_exp = new RegExp(regexp)
    if(!reg_exp.test(url))
    {
        return false;
    }

    return reg_exp.exec(url)
}

all_regexp = []
function guiGetTestUrlFunctionfunction(regexp, api_path_value)
{
    all_regexp.push({path:api_path_value.path , regexp:regexp})

    return function(url)
    {
        var res = guiTestUrl(regexp, url)
        if(!res)
        {
            return false;
        }

        for(let i in res.groups)
        {
            if(i.indexOf("api_") == 0 && res.groups[i][0] == '@')
            { 
                res.groups[i] = res.groups[i].substring(1)
            }
        }
        
        var obj = res.groups
        obj.url = res[0]                 // текущий урл в блоке
        obj.page_and_parents = res[0]    // страница+родители

        if(obj.page)
        {
            var match = obj.page.match(/(?<parent_type>[A-z]+)\/(?<parent_id>[0-9]+)\/(?<page_type>[A-z\/]+)$/)

            if(match && match.groups)
            {
                obj.parent_type = match.groups.parent_type
                obj.parent_id = match.groups.parent_id
                obj.page_type = match.groups.page_type.replace(/\/[A-z]+$/, "")
                obj.page_name = match.groups.page_type
            }
        }
        

        obj.searchURL = function(query){

            let url = this.page_and_parents
            url = url.replace(this.search_part, "")

            url +=  "/search/" + query
            if(this.page_part)
            {
                url = url.replace(this.page_part, "")
                //url += this.page_part
            }

            return vstMakeLocalUrl(url);
        }

        obj.baseURL = function(){
            return vstMakeLocalUrl(this.page.replace(/\/[^/]+$/, ""));
        }

        obj.getApiPath = function (){
            return {api:api_path_value, url:this}
        }

        return obj
    }
}

/**
 * По пути в апи определяет ключевое имя для регулярного выражения урла страницы
 * @param {type} api_path
 * @returns {getNameForUrlRegExp.url}
 */
function getNameForUrlRegExp(api_path)
{
    //var url = api_path.replace(/\{([A-z]+)\}\//g, "(?<api_$1>[0-9,]+)\/").replace(/\/$/, "").replace(/^\//, "").replace(/\//g, "\\/")
    var url = api_path.replace(/\{([A-z]+)\}\//g, "(?<api_$1>[0-9,]+|@[A-z0-9]+)\/").replace(/\/$/, "").replace(/^\//, "").replace(/\//g, "\\/")
    return url; // ((?<parent_id>[0-9]+)|(?<=@)(?<parent_id>[A-z0-9]+))
}

/**
 * Создаёт страницу экшена
 * @param {Object} api
 * @param {Object} api_path
 * @param {Object} action
 * @returns {undefined}
 * @deprecated Надо бы объеденить и унифицировать код так чтоб он был един ещё и для openApi_add_one_page_path
 */
function openApi_add_one_action_page_path(api_obj)
{
    let api_path = api_obj.path

    // Страница элемента вложенного куда угодно
    let page_url_regexp = "^(?<parents>[A-z]+\\/[0-9]+\\/)*(?<page>"+getNameForUrlRegExp(api_path.toLowerCase().replace(/\/([A-z0-9]+)\/$/, "/"))+")\\/(?<action>"+api_obj.name+")$"
    let regexp_in_other = guiGetTestUrlFunctionfunction(page_url_regexp, api_obj);

    spajs.addMenu({
        id:getMenuIdFromApiPath(api_path),
        url_parser:[regexp_in_other],
        priority:api_obj.level,
        debug: api_obj.path,
        onOpen:function(holder, menuInfo, data, onClose_promise)
        {
            let pageItem = new guiObjectFactory(api_obj)

            var def = new $.Deferred();
            $.when(pageItem).done(function()
            {
                def.resolve(pageItem.renderAsPage())
            }).fail(function(err)
            {
                def.resolve(renderErrorAsPage(err));
            })
 
            $.when(onClose_promise).always(() => {
                pageItem.stopUpdates();
            })

            return def.promise();
        },
    })
}

/**
 * Создаёт страницу объекта
 * @param {Object} api
 * @param {Object} api_path
 * @param {Object} pageMainBlockObject
 * @param {Number} urlLevel
 * @returns {undefined}
 */
function openApi_add_one_page_path(api_obj)
{
    let api_path = api_obj.path

    // Определяем тип страницы из урла (есть у него id в конце или нет)
    let page_url_regexp = "^(?<parents>[A-z]+\\/[0-9]+\\/)*(?<page>"+getNameForUrlRegExp(api_path)+")$"
   
    // Страница элемента вложенного куда угодно
    let regexp_in_other = guiGetTestUrlFunctionfunction(page_url_regexp, api_obj);

    spajs.addMenu({
        id:getMenuIdFromApiPath(api_path),
        url_parser:[regexp_in_other],
        priority:api_obj.level,
        onOpen:function(holder, menuInfo, data, onClose_promise)
        {
            let pageItem = new guiObjectFactory(api_obj)

            var def = new $.Deferred();
            $.when(pageItem.load(data.reg)).done(function()
            {
                def.resolve(pageItem.renderAsPage())
            }).fail(function(err)
            {
                def.resolve(renderErrorAsPage(err));
            })
 
            $.when(onClose_promise).always(() => { 
                pageItem.stopUpdates();
            })

            return def.promise();
        },
    })
}


/**
 * Создаёт страницу списка и страницу с формой создания объекта
 * @param {Object} api
 * @param {Object} api_path
 * @param {Object} pageMainBlockObject
 * @param {Number} urlLevel
 * @returns {undefined}
 */
//
function openApi_add_list_page_path(api_obj)
{

    let path_regexp = []
    let api_path = api_obj.path

    let pathregexp = "^"
        +"(?<page_and_parents>"
        +"(?<parents>[A-z]+\\/[0-9]+\\/)*"
        +"(?<page>"+getNameForUrlRegExp(api_path)+"))"
        +"(?<search_part>\\/search\\/(?<search_query>[A-z0-9 %\-.:,=]+)){0,1}"
        +"(?<page_part>\\/page\\/(?<page_number>[0-9]+)){0,1}$"

    path_regexp.push(guiGetTestUrlFunctionfunction(pathregexp, api_obj))

    // Проверяем есть ли возможность создавать объекты
    if(api_obj.canCreate)
    {
        // Если есть кнопка создать объект то надо зарегистрировать страницу создания объекта
        let new_page_url = guiGetTestUrlFunctionfunction("^(?<parents>[A-z]+\\/[0-9]+\\/)*(?<page>"+getNameForUrlRegExp(api_path)+")\\/new$", api_obj)
         
        spajs.addMenu({
            id:getMenuIdFromApiPath(api_path + "_new"),
            url_parser:[new_page_url],
            priority:api_obj.level,
            onOpen:function(holder, menuInfo, data)
            {
                let pageItem = new guiObjectFactory(api_obj)
                return pageItem.renderAsNewPage()
            },
        })

    }

    // Страница добавления под элементов
    if(api_obj.canAdd)
    {
        // Если есть кнопка создать объект то надо зарегистрировать страницу создания объекта
        var add_page_url = guiGetTestUrlFunctionfunction("^(?<page_and_parents>(?<parents>[A-z]+\\/[0-9]+\\/)*(?<page>"+getNameForUrlRegExp(api_path)+"\\/add))(?<search_part>\\/search\\/(?<search_query>[A-z0-9 %\-.:,=]+)){0,1}(?<page_part>\\/page\\/(?<page_number>[0-9]+)){0,1}$", api_obj)

        spajs.addMenu({
            id:getMenuIdFromApiPath(api_path + "_add"),
            url_parser:[add_page_url],
            priority:api_obj.level,
            onOpen:function(holder, menuInfo, data, onClose_promise)
            {
                let pageItem = new guiObjectFactory(api_obj.shortestURL)
                let filter = $.extend(true, data.reg)
                filter.parent_id = undefined
                filter.parent_type = undefined

                var def = new $.Deferred();
                $.when(pageItem.search(filter)).done(function()
                {
                    def.resolve(pageItem.renderAsAddSubItemsPage())
                }).fail(function(err)
                {
                    def.resolve(renderErrorAsPage(err));
                })
 
                $.when(onClose_promise).always(() => {
                    pageItem.stopUpdates();
                })

                return def.promise();
            },
        })
    }

    spajs.addMenu({
        id:getMenuIdFromApiPath(api_path),
        url_parser:path_regexp,
        priority:api_obj.level,
        onOpen:function(holder, menuInfo, data, onClose_promise)
        {
            let pageItem = new guiObjectFactory(api_obj)

            var def = new $.Deferred();
            $.when(pageItem.search(data.reg)).done(function()
            {
                def.resolve(pageItem.renderAsPage()) 
            }).fail(function(err)
            {
                def.resolve(renderErrorAsPage(err));
            })
             
            $.when(onClose_promise).always(() => {
                pageItem.stopUpdates();
            })

            return def.promise();
        },
        onClose:function(){
            
        }
    })
}

tabSignal.connect("resource.loaded", function()
{
    window.api = new guiApi(); 
    $.when(window.api.init()).done(function()
    {
        // Событие в теле которого можно было бы переопределить ответ от open api
        tabSignal.emit("openapi.loaded",  {api: window.api});

        $.when(getGuiSchema()).done(function ()
        {
            //.. декодирование схемы из кэша 
            window.guiSchema.path = returnParentLinks(window.guiSchema.path);

            emitFinalSignals()

        }).fail(()=>{

            window.guiSchema = openApi_guiSchema(window.api.openapi);
            tabSignal.emit("openapi.schema",  {api: window.api, schema:window.guiSchema});
          
            //... Сохранение в кеш схемы
            //if(notUseCache() != "true")
            //{
                let guiSchemaForCache =
                    {
                        path: deleteParentLinks(window.guiSchema.path),
                        object: window.guiSchema.object,
                    }
                guiFilesCache.setFile('guiSchema', JSON.stringify(guiSchemaForCache));
            //}
            window.guiSchema.path = returnParentLinks(window.guiSchema.path);

            emitFinalSignals();
        })

    })
})


/*
 * Function checks is there cache fo guiSchema.
 * If it is, function calls getGuiSchemaFromCache().
 */
function getGuiSchema()
{
    let def = new $.Deferred();
    if(notUseCache() == "true")
    {
        def.reject();
    }
    else
    {
        $.when(getGuiSchemaFromCache()).done(data => {
            def.resolve();
        }).fail(f => {
            def.reject();
        })
    }

    return def.promise();
}


/*
 * Function returns guiSchema from cache.
 */
function getGuiSchemaFromCache()
{
    let def = new $.Deferred();
    let guiSchemaFromCache = guiFilesCache.getFile('guiSchema');
    guiSchemaFromCache.then(
        result => {
            window.guiSchema = JSON.parse(result.data);
            def.resolve();
        },
        error => {
            def.reject();
        }
    )

    return def.promise();
}


/*
 * Function deletes circular links in paths.
 * It's necessary procedure before putting guiSchema into cache.
 */
function deleteParentLinks(path_obj)
{
    
    //@todo улучшить функцию deleteByPatternInSchema так чтоб можно было все операции сделать за 1 прохрд и для __func__ и для __link__ 
    let del_func = deleteByPatternInSchema(path_obj, '__func__')
    let del_link = deleteByPatternInSchema(path_obj, '__link__')
    
    let action = []
    for(let i in del_func)
    {
        action.push("delete path_obj"+del_func[i])
    }

    for(let i in del_link)
    {
        action.push("delete path_obj"+del_link[i])
    }
    eval(action.join(";"))
  
    return path_obj;
}

function deleteByPatternInSchema(obj, pattern, max_level = 0, level = 0, path = "", objects = [])
{
    if(!obj)
    {
        return undefined;
    }

    if(level > 20)
    {
        console.warn(obj, pattern, max_level, level)
        debugger;
        throw "Error level > "+level
    }
     
    if(max_level && max_level <= level)
    {
        debugger;
        return undefined;
    }
 
    if(typeof obj != 'object')
    {
        return undefined;
    }

    for(var i in obj)
    {
        if(i.indexOf(pattern) == 0)
        {  
            objects.push(path+"['"+i.replace(pattern, "")+"']")
            continue;
        }

        if(typeof obj[i] == 'object')
        { 
            if(obj["__link__"+i])
            { 
                // skip
            }
            else
            { 
                deleteByPatternInSchema(obj[i], pattern, max_level, level+1, ""+path+"['"+i+"']", objects)
            } 
        }
    }

    return objects;
}

/*
 * Function returns circular links in paths.
 * It's necessary procedure after getting guiSchema from cache.
 */
function returnParentLinks(path_obj)
{
    //@todo улучшить функцию getFunctionNameBySchema так чтоб можно было все операции сделать за 1 прохрд и для __func__ и для __link__ 
    //@todo можно вместо того чтоб пробежаться рекурсивно каждый раз сохранить список ключей над которыми нужно выполнить операцию и закешировать его.
    let del_func = getFunctionNameBySchema(path_obj, '__func__', (obj, key) => {
        
        if(!window[obj[key]])
        {
            throw "error function "+obj[key]+" not exists"
        }

        return window[obj[key]];
    })
    
    let del_links = getFunctionNameBySchema(path_obj, '__link__', (obj, key) => { 
        
        if(!path_obj[obj[key]])
        {
            throw "error link "+obj[key]+" not exists"
        }

        return path_obj[obj[key]];
    })
 
    let action = []
    for(let i in del_func)
    {
        action.push("delete path_obj"+del_func[i])
    }

    for(let i in del_links)
    {
        action.push("delete path_obj"+del_links[i])
    }
    eval(action.join(";"))

    /*getFunctionNameBySchema(path_obj, '__link__', (obj, key) => {
        debugger;
        if(obj[key])
        {
            let keyname =  key.replace('__link__', '');
            obj[keyname] = {};
            for(let item in obj[key])
            {
                if(obj[key][item].indexOf('__func__') == 0)
                {
                    obj[keyname][item] = {
                        name: item,
                        onClick: findFunctionByName(obj[key][item], '__func__'),
                    }
                }
                else
                {
                    obj[keyname][item] = path_obj[obj[key][item]];
                }
            }
            return obj[keyname];
        }
        return {};

    }, 10)*/
    

    return path_obj;
}


/*
 * Function emits signals which are necessary to call after getting guiSchema.
 */
function emitFinalSignals()
{ 
    emitSchemaPathSignals(window.guiSchema.path);

    openApi_guiPagesBySchema(window.guiSchema)

    // Событие в теле которого можно было бы переопределить и дополнить список страниц
    tabSignal.emit("openapi.paths",  {api: window.api});

    tabSignal.emit("openapi.completed",  {api: window.api});

    tabSignal.emit("loading.completed");
}

