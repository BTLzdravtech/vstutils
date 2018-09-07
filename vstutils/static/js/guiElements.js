
var guiElements = {
}

guiElements.base = function(opt = {}, value, parent_object)
{
    this.opt = opt
    this.value = value
    this.element_id = ("filed_"+ Math.random()+ "" +Math.random()+ "" +Math.random()).replace(/\./g, "")
    this.onChange_calls = []

    this.setValue = function(value)
    {
        this.value = value
    }

    this.reductionToType = function(value)
    {

        if(this.render_options.type == "string" || this.render_options.type == "file")
        {
            if(!value)
            {
                return ""
            }

            return value.toString()
        }

        if(this.render_options.type == "number" || this.render_options.type == "integer" )
        {
            return value/1
        }

        if(this.render_options.type == "boolean" )
        {
            return value == true
        }

        return value
    }

    this._onRender = function(options)
    {
        $('#'+this.element_id).on('change', false, () => {
            this._callAllonChangeCallback()
        })

        if(options.onclick)
        {
            $('#'+this.element_id).on('click', false, options.onclick)
        }
    }

    this.render = function(render_options)
    {
        if(render_options !== undefined)
        {
            this.render_options = $.extend({}, opt, render_options)
        }
        else if(this.render_options === undefined)
        {
            this.render_options = $.extend({}, opt)
        }

        if(this.render_options.hideReadOnly && this.render_options.readOnly)
        {
            return "";
        }

        return spajs.just.render("guiElements."+this.name , {opt:this.render_options, guiElement:this, value:this.value}, () => {
            this._onRender(this.render_options)
            this._callAllonChangeCallback()
        });
    }

    this.getValue = function()
    {
        let value = $("#"+this.element_id).val();
        let default_value = this.opt.default;

        if(!value && default_value)
        {
            return  this.reductionToType(default_value);
        }
        else
        {
            return this.reductionToType(value);
        }

    }

    this.getValidValue = function()
    {
        let value = this.getValue()

        let filed = this.render_options

        let value_length = 0
        if(value)
        {
            value_length = value.toString().length
        }

        if(filed.maxLength && value_length > filed.maxLength)
        {
            debugger;
            throw {error:'validation', message:'Filed '+filed.name +" is too long"}
        }

        if(filed.minLength)
        {
            if(value_length == 0)
            {
                if(filed.required)
                {
                    debugger;
                    throw {error:'validation', message:'Filed '+filed.name +" is empty"}
                }
                else
                {
                    return undefined
                }
            }

            if(value_length < filed.minLength)
            {
                debugger;
                throw {error:'validation', message:'Filed '+filed.name +" is too short"}
            }
        }

        if((value === "" || value === undefined) && filed.required && !this.opt.default)
        {
            throw {error:'validation', message:'Filed '+filed.name +" is required"}
        }

        if(value === "" && !this.opt.default)
        {
            return undefined
        }

        return value;
    }

    /**
     * Добавляет колбек на событие onChange чтоб зависимые поля могли вовремя перестроиться
     * @param {function} callback
     * @returns {undefined}
     *
     * @example На пример так поле notes становится зависимым от поля name у проектов
     *  window.api.openapi.definitions.OneProject.properties.notes.dependsOn = ['name']
     */
    this.addOnChangeCallBack = function(callback)
    {
        this.onChange_calls.push(callback)
    }

    this._callAllonChangeCallback = function()
    {
        let val = this.getValue()
        for(let i in this.onChange_calls)
        {
            this.onChange_calls[i]({
                filed:this,
                opt:opt,
                value:val
            })
        }
    }
    /**
     * Вызывается для перестройки поля в тот момент когда поле от которого мы зависим поменяло значение
     * @param {function} callback
     * @returns {undefined}
     */
    this.updateOptions = function(arg)
    {
        if(opt.onUpdateOptions)
        {
            if(typeof opt.onUpdateOptions != 'object')
            {
                opt.onUpdateOptions = [opt.onUpdateOptions]
            }

            for(let i in opt.onUpdateOptions)
            {
                opt.onUpdateOptions[i](this, arg)
            }
        }
    }
}

/**
 *
 * @param {type} opt
 * @returns {guiElements.button}
 *
 * opt = {
 * class:''     - css
 * link:''      - ссылка
 * title:''     - подсказка
 * onclick:''   - текст события onclick
 * text:''      - текст надписи
 * }
 */
guiElements.link_button = function(opt = {})
{
    this.name = 'link_button'
    guiElements.base.apply(this, arguments)
}

guiElements.string = function()
{
    this.name = 'string'
    guiElements.base.apply(this, arguments)
}

guiElements.password = function()
{
    this.name = 'password'
    guiElements.base.apply(this, arguments)
}

guiElements.button = function()
{
    this.name = 'button'
    guiElements.base.apply(this, arguments)
}

guiElements.enum = function(opt = {}, value)
{
    this.name = 'enum'
    guiElements.base.apply(this, arguments)

    this._onBaseRender = this._onRender
    this._onRender = function(options)
    {
        this._onBaseRender(options)

        $('#'+this.element_id).select2({
            width: '100%',
        });
    }
}

guiElements.file = function(opt = {})
{
    this.name = 'file'
    guiElements.base.apply(this, arguments);

    this.getValue = function ()
    {
        return $('#fileContent_' + this.element_id).val();
    }
}

guiElements.secretfile = function(opt = {})
{
    this.name = 'secretfile'
    guiElements.file.apply(this, arguments);
}

guiElements.boolean = function()
{
    this.name = 'boolean'
    guiElements.base.apply(this, arguments)

    this.getValue = function()
    {
        return $("#"+this.element_id).hasClass('selected');
    }
}

guiElements.html = function(opt = {})
{
    this.name = 'html'
    guiElements.base.apply(this, arguments)

    this.getValue = function()
    {
        return undefined;
    }
}

guiElements.textarea = function(opt = {})
{
    this.name = 'textarea';
    guiElements.base.apply(this, arguments)
}

guiElements.autocomplete = function()
{
    this.name = 'autocomplete'
    guiElements.base.apply(this, arguments)

    this.getValue = function()
    {
        if (this.matches &&
            this.opt.additionalProperties &&
            this.opt.additionalProperties.view_field &&
            this.opt.additionalProperties.value_field)
        {
            var value = $("#" + this.element_id).val();
            var data_value = $("#" + this.element_id).attr('value');
            var match = false;
            for (var i in this.matches)
            {
                if (value == this.matches[i]['view_field'] &&
                    data_value == this.matches[i]['value_field'])
                {
                    match = true;
                }
            }

            if (match)
            {
                return data_value;
            }
            else
            {
                return value
            }
        }
        else
        {
            return $("#" + this.element_id).val();
        }
    }

    this._onBaseRender = this._onRender
    this._onRender = function(options)
    {
        this._onBaseRender(options)

        /*
         * options.searchObj - object for JS hardcode, which aim is to redefine way of getting data for autocomplete.
         *
         * Example of hardcode:
         * tabSignal.connect("openapi.factory.ansiblemodule", function(data)
         * {
         *      let inventory = apiansiblemodule.one.view.definition.properties.inventory;
         *      inventory.type = "autocomplete"
         *      inventory.searchObj = new apiinventory.list();
         * });
         */
        if(options.searchObj)
        {
            return new autoComplete({
                selector: '#'+this.element_id,
                minChars: 0,
                cache:false,
                showByClick:true,
                menuClass:'autocomplete autocomplete-'+this.element_id,
                renderItem: function(item, search)
                {
                    return '<div class="autocomplete-suggestion" data-value="' + item.id + '" >' + item.name + '</div>';
                },
                onSelect: (event, term, item) =>
                {
                    let value = $(item).attr('data-value');
                    $('#'+this.element_id).val($(item).text());
                    $('#'+this.element_id).attr('value', value);
                    $('#'+this.element_id).attr({'data-hide':'hide'});
                },
                source: (original_term, response) =>
                {
                    let search_str = trim(original_term);

                    let isHide = $('#'+this.element_id).attr('data-hide')
                    if(isHide == "hide")
                    {
                        $('#'+this.element_id).attr({'data-hide':'show'})
                        return;
                    }

                    $.when(options.searchObj.search(search_str)).done((rawdata) => {

                        if(!rawdata || !rawdata.data || !rawdata.data.results)
                        {
                            response([])
                        }

                        if(options.matcher)
                        {
                            response(options.matcher(rawdata))
                            return;
                        }

                        response(rawdata.data.results)

                    }).fail(() => {
                        response([])
                    })
                }
            });
        }
        /*
         * options.enum - array, which comes from api.
         * This array has data for autocomplete.
         */
        else if(options.enum)
        {
            return new autoComplete({
                selector: '#'+this.element_id,
                minChars: 0,
                cache:false,
                showByClick:true,
                menuClass:'autocomplete autocomplete-'+this.element_id,
                renderItem: function(item, search)
                {
                    return '<div class="autocomplete-suggestion" data-value="' + item + '" >' + item + '</div>';
                },
                onSelect: (event, term, item) =>
                {
                    let value = $(item).attr('data-value');
                    $('#'+this.element_id).val($(item).text());
                    $('#'+this.element_id).attr('value', value);
                    $('#'+this.element_id).attr({'data-hide':'hide'});
                },
                source: (original_term, response) =>
                {
                    let search_str = trim(original_term);

                    let isHide = $('#'+this.element_id).attr('data-hide')
                    if(isHide == "hide")
                    {
                        $('#'+this.element_id).attr({'data-hide':'show'})
                        return;
                    }

                    let choices = options.enum;

                    let matches = [];
                    for(let i in choices)
                    {
                        if (choices[i].toLowerCase().indexOf(search_str.toLowerCase()) != -1)
                        {
                            matches.push(choices[i]);
                        }
                    }
                    response(matches);
                }
            });
        }
        /*
         * options.additionalProperties - object, which comes from api.
         * This object has info about model and fields, where data for autocomplete is stored.
         */
        else if(options.additionalProperties)
        {
            let props = getInfoFromAdditionalProperties(options);
            let obj = props['obj'];
            let value_field = props['value_field'];
            let view_field = props['view_field'];

            return new autoComplete({
                selector: '#'+this.element_id,
                minChars: 0,
                delay:350,
                cache:false,
                showByClick:true,
                menuClass:'autocomplete autocomplete-'+this.element_id,
                renderItem: function(item, search)
                {
                    return '<div class="autocomplete-suggestion" data-value="' + item.value_field + '" >' + item.view_field + '</div>';
                },
                onSelect: (event, term, item) =>
                {
                    var value = $(item).attr('data-value');
                    $('#'+this.element_id).val($(item).text());
                    $('#'+this.element_id).attr('value', value);
                    $('#'+this.element_id).attr({'data-hide':'hide'});
                },
                source: (original_term, response) =>
                {
                    let search_str = trim(original_term);

                    let isHide = $('#'+this.element_id).attr('data-hide')
                    if(isHide == "hide")
                    {
                        $('#'+this.element_id).attr({'data-hide':'show'})
                        return;
                    }

                    if(obj)
                    {
                        let list = new obj.list();

                        let filters = getFiltersForAutocomplete(list, search_str, view_field);

                        $.when(list.search(filters)).done((data) => {

                            let res = data.data.results;
                            let matches = [];

                            for(let i in res)
                            {
                                matches.push({
                                    value_field: res[i][value_field],
                                    view_field: res[i][view_field],
                                });
                            }

                            this.matches = matches;

                            response(matches)

                        }).fail((e) => {
                            response([]);
                        });
                    }
                }
            });
        }
    }
}

guiElements.select2 = function(filed, filed_value, parent_object)
{
    this.name = 'select2'
    guiElements.base.apply(this, arguments)

    this._onBaseRender = this._onRender
    this._onRender = function(options)
    {
        this._onBaseRender(options)

        /*
         * options.search - function for JS hardcode, which aim is to redefine way of getting data for select2.
         * @param {object} params - argument from select2 transport function
         * @param {object} filed - filed to which we want add select2
         * @param {integer/string} filed_value - value of field
         * @param {object} parent_object - object (one) - model of single object page
         * @returns Deferred object
         *
         * Example of hardcode:
         * tabSignal.connect("openapi.factory.ansiblemodule", function(data)
         * {
         *      let filed = apiansiblemodule.one.view.definition.properties.inventory;
         *      filed.format = "select2"
         *      filed.search = function(params, filed, filed_value, parent_object)
         *      {
         *          //some code here
         *      }
         * });
         */
        if(options.search)
        {
            return $('#'+this.element_id).select2({
                width: '100%',
                ajax: {
                    transport: function (params, success, failure)
                    {
                        $.when(options.search(params, filed, filed_value, parent_object)).done((results) =>
                        {
                            /*
                             * {
                                "results": [
                                  {
                                    "id": 1,
                                    "text": "Option 1"
                                  },
                                  {
                                    "id": 2,
                                    "text": "Option 2"
                                  }
                                ],
                                "pagination": {
                                  "more": true
                                }
                              }
                             */
                            success(results)
                        }).fail(() => {
                            failure([])
                        })
                    }
                }
            });
        }
        /*
         * options.enum - array, which comes from api.
         * This array has data for select2.
         */
        else if(options.enum)
        {
            let data = [];
            for(let i in options.enum)
            {
                data.push(
                    {
                        id: options.enum[i],
                        text: options.enum[i],
                    }
                )
            }

            $('#'+this.element_id).select2({
                width: '100%',
                data: data
            });
        }
        /*
         * options.additionalProperties - object, which comes from api.
         * This object has info about model and fields, where data for select2 is stored.
         */
        else if(options.additionalProperties)
        {
            let props = getInfoFromAdditionalProperties(options);
            let obj = props['obj'];
            let value_field = props['value_field'];
            let view_field = props['view_field'];

            if(obj)
            {
                let list = new obj.list();

                $('#'+this.element_id).select2({
                    width: '100%',
                    ajax: {
                        delay: 350,
                        transport: function (params, success, failure)
                        {
                            let search_str = trim(params.data.term);

                            let filters = getFiltersForAutocomplete(list, search_str, view_field);

                            $.when(list.search(filters)).done((data) =>
                            {
                                let results =[];
                                let api_data = data.data.results;
                                for(let i in api_data)
                                {
                                    results.push(
                                        {
                                            id: api_data[i][value_field],
                                            text: api_data[i][view_field]
                                        }
                                    )
                                }
                                success({results:results})
                            }).fail(() => {
                                failure([])
                            })
                        }
                    }
                });
            }
        }
    }
}

guiElements.dynamic = function(opt = {}, value, parent_object)
{
    this.name = 'dynamic'
    guiElements.base.apply(this, arguments)


    if(!opt.dynamic_type)
    {
        opt.dynamic_type = 'string'
    }

    this.realElement = new guiElements[opt.dynamic_type]($.extend({}, opt, opt.override_opt), value, parent_object);

    let thisObj = this;
    let func = function(name)
    {
        return function(){ return thisObj.realElement[name].apply(thisObj.realElement, arguments)}
    }

    this.getValue = func('getValue')

    this.setType = function(type, override_opt)
    {
        if(!guiElements[type])
        {
            type = 'string'
            console.error("Error: Set type guiElements."+type+" for dynamic filed")
        }

        let lastValue = this.realElement.getValue();

        let options = $.extend({}, opt, override_opt);

        if(type == "boolean" && options.default !== undefined && options.readOnly)
        {
            lastValue = options.default;
        }

        this.realElement = new guiElements[type](options, value, parent_object);

        this.realElement.setValue(lastValue);
        $('#gui'+this.element_id).insertTpl(this.realElement.render());
    }

    this.opt.onUpdateOptions = [];
    this.opt.onUpdateOptions.push(function (filedObj, newValue) {

        var new_type = "string";
        var override_opt = {};
        var value = newValue.value;

        if(opt.additionalProperties && opt.additionalProperties.types)
        {
            var types = opt.additionalProperties.types;

            if(types[value])
            {
                new_type = types[value];
            }
        }

        if(opt.additionalProperties && opt.additionalProperties.choices)
        {
            var choices = opt.additionalProperties.choices;

            for (var i in choices)
            {
                if (i == value)
                {
                    if ($.isArray(choices[value]))
                    {
                        var boolean = false;
                        for (var i in choices[value])
                        {
                            if (typeof(choices[value][i]) == 'boolean')
                            {
                                boolean = true;
                            }
                        }

                        if (boolean)
                        {
                            new_type = "boolean";
                            if (choices[value].length == 1)
                            {
                                var boolean_default = choices[value][0];
                                override_opt.default = boolean_default;
                                override_opt.readOnly = true;
                            }
                        }
                        else
                        {
                            new_type = "enum";
                            override_opt = {enum: choices[value]};
                        }
                    }
                }
            }
        }

        thisObj.setType(new_type, override_opt);
    });

}

guiElements.crontab = function (opt = {}, value)
{
    this.name = 'crontab'
    guiElements.base.apply(this, arguments)

    this.model = {}

    this.model.MonthsNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    this.model.DaysOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    this.model.Months = {}
    this.model.DayOfMonth = {}
    this.model.DaysOfWeek = {}
    this.model.Hours = {}
    this.model.Minutes = {}

    this.model.MonthsStr = "*"
    this.model.DayOfMonthStr = "*"
    this.model.DaysOfWeekStr = "*"
    this.model.HoursStr = "*"
    this.model.MinutesStr = "*"

    this.value = value || "* * * * *";

    this.render = function(render_options)
    {
        if(render_options !== undefined)
        {
            this.render_options = $.extend({}, opt, render_options)
        }
        else if(this.render_options === undefined)
        {
            this.render_options = $.extend({}, opt)
        }

        if(this.render_options.description === undefined)
        {
            this.render_options.description = "Time must be specified according to " + window.timeZone + " time zone";
        }

        this.parseCronString(this.value);
        return spajs.just.render("guiElements."+this.name, {opt:this.render_options, guiElement: this, value: this.value }, () => {
            this._onRender();
            this._callAllonChangeCallback();
        });
    }

    this._onRender = function ()
    {
        $("#"+this.element_id).on('change', false, () => {
            this.parseCronString($("#"+this.element_id).val());
        })

        $("#"+this.element_id).on('paste', () => {

            setTimeout(
                () => {
                    let val = $("#"+this.element_id).val();
                    this.parseCronString(val);
                },100)
        })
    }

    this.parseCronString = function(string)
    {
        if(string !== undefined)
        {
            this.value = string
        }

        var string = trim(this.value).split(" ");
        if(string.length != 5 || /[A-z]/.test(this.value))
        {
            this.value = "* * * * *";
            string = trim(this.value).split(" ");

        }

        this.model.MinutesStr = string[0]
        this.model.HoursStr = string[1]
        this.model.DayOfMonthStr = string[2]
        this.model.MonthsStr = string[3]
        this.model.DaysOfWeekStr = string[4]


        this.parseItem(this.model.Minutes, this.model.MinutesStr, 0, 59)
        this.parseItem(this.model.Hours, this.model.HoursStr, 0, 23)
        this.parseItem(this.model.DayOfMonth, this.model.DayOfMonthStr, 1, 31)
        this.parseItem(this.model.Months, this.model.MonthsStr, 1, 12)
        this.parseItem(this.model.DaysOfWeek, this.model.DaysOfWeekStr, 0, 6)

    }

    this.setDaysOfWeek = function(value)
    {
        this.value = this.value.replace(/^([^ ]+) +([^ ]+) +([^ ]+) +([^ ]+) +([^ ]+)/img, '$1 $2 $3 $4 '+value);
        this.parseCronString();
        this.setValue();
    }

    this.setMonths = function(value)
    {
        this.value = this.value.replace(/^([^ ]+) +([^ ]+) +([^ ]+) +([^ ]+) +([^ ]+)/img, '$1 $2 $3 '+value+' $5');
        this.parseCronString();
        this.setValue();
    }

    this.setDayOfMonth = function(value)
    {
        this.value = this.value.replace(/^([^ ]+) +([^ ]+) +([^ ]+) +([^ ]+) +([^ ]+)/img, '$1 $2 '+value+' $4 $5');
        this.parseCronString();
        this.setValue();
    }

    this.setHours = function(value)
    {
        this.value = this.value.replace(/^([^ ]+) +([^ ]+) +([^ ]+) +([^ ]+) +([^ ]+)/img, '$1 '+value+' $3 $4 $5');
        this.parseCronString();
        this.setValue();
    }

    this.setMinutes = function(value)
    {
        this.value = this.value.replace(/^([^ ]+) +([^ ]+) +([^ ]+) +([^ ]+) +([^ ]+)/img, value+' $2 $3 $4 $5');
        this.parseCronString();
        this.setValue();
    }

    /**
     * Парсит отдельный элемент в cron строке
     * @param {type} resArr
     * @param {type} str
     * @param {type} minInt
     * @param {type} maxInt
     * @returns {Array}
     */
    this.parseItem = function(resArr, str, minInt, maxInt)
    {
        for(var i=minInt; i< maxInt; i++)
        {
            resArr[i] = false;
        }

        for(var i in resArr)
        {
            resArr[i] = false;
        }

        if(!str)
        {
            str = "*";
        }

        var Parts = str.split(",")
        for(var i in Parts)
        {
            if(/^\*$/.test(Parts[i]))
            {
                if(minInt < maxInt)
                {
                    for(var j = minInt; j <= maxInt; j++)
                    {
                        resArr[j] = true
                    }
                }
            }
            else if(/^\*\/([0-9]+)$/.test(Parts[i]))
            {
                var match = /^\*\/([0-9]+)$/.exec(Parts[i])
                if(minInt < maxInt && match[1]/1 >= 1)
                {
                    for(var j = minInt; j <= maxInt; j+= match[1]/1)
                    {
                        resArr[j] = true
                    }
                }
            }
            else if(/^([0-9]+)-([0-9]+)$/.test(Parts[i]))
            {
                var match = /^([0-9]+)-([0-9]+)$/.exec(Parts[i])
                if(match[1]/1 > maxInt)
                {
                    match[1] = minInt
                }
                if(match[2]/1 > maxInt)
                {
                    match[2] = maxInt
                }

                if(match[1]/1 < match[2]/1)
                {
                    for(var j = match[1]/1; j <= match[2]/1; j++)
                    {
                        resArr[j] = true
                    }
                }
            }
            else if(/^([0-9]+)$/.test(Parts[i]))
            {
                if(Parts[i]/1 <= maxInt && Parts[i]/1 >= minInt)
                {
                    resArr[Parts[i]/1] = true
                }
            }
            else if(/^([0-9]+)\/([0-9]+)$/.test(Parts[i]))
            {
                var match = /^([0-9]+)\/([0-9]+)$/.exec(Parts[i])
                if(match[1]/1 > maxInt)
                {
                    match[1] = minInt
                }
                if(match[1]/1 < maxInt && match[2]/1 >= 1)
                {
                    for(var j = match[1]/1; j <= maxInt; j+=match[2]/1)
                    {
                        resArr[j] = true
                    }
                }
            }
            else if(/^([0-9]+)-([0-9]+)\/([0-9]+)$/.test(Parts[i]))
            {
                var match = /^([0-9]+)-([0-9]+)\/([0-9]+)$/.exec(Parts[i])
                if(match[1]/1 > maxInt)
                {
                    match[1] = minInt
                }
                if(match[2]/1 > maxInt)
                {
                    match[2] = maxInt
                }

                if(match[1]/1 < match[2]/1 && match[3]/1 >= 1)
                {
                    for(var j = match[1]/1; j <= match[2]/1; j+=match[3]/1)
                    {
                        resArr[j] = true
                    }
                }
            }
        }



        return resArr;
    }

    this.getValue = function()
    {
        this.setValue()
        return this.value;
    }

    this.compileItem = function(resArr, minInt, maxInt)
    {
        var itemResults = []
        itemResults.push(resArr.join(","))
        if(!resArr || !resArr.length || resArr.length == maxInt - minInt + 1)
        {
            return "*";
        }

        if(resArr.length)
        {
            var division = [];
            for(var j=2; j<maxInt/2; j++)
            {
                var isInner = false
                for(var k in division)
                {
                    if(j % division[k] == 0)
                    {
                        isInner = true;
                    }
                }

                if(isInner)
                {
                    continue;
                }

                var isOk = true
                for(var i=minInt; i<maxInt; i+=j)
                {
                    if(resArr.indexOf(i) == -1)
                    {
                        isOk = false;
                        break;
                    }
                }

                if(isOk)
                {
                    division.push(j);
                }
            }

            var exclude = []
            var includeParts = []
            for(var i in division)
            {
                for(var j=minInt; j<maxInt; j+=division[i])
                {
                    exclude.push(j)
                }
                includeParts.push("*/"+division[i])
            }

            var lastVal = -1;
            var range = [];

            for(var i in resArr)
            {
                if(exclude.indexOf(resArr[i]) != -1)
                {
                    continue;
                }

                if(lastVal + 1 == resArr[i] )
                {
                    range.push(resArr[i])
                }
                else
                {
                    if(range.length > 2)
                    {
                        includeParts.push(range[0] + "-" + range[range.length-1])
                    }
                    else if(range.length)
                    {
                        for(var l in range)
                        {
                            includeParts.push(range[l])
                        }
                    }
                    range = [resArr[i]]
                }

                lastVal = resArr[i]
            }

            if(range.length > 2)
            {
                includeParts.push(range[0] + "-" + range[range.length-1])
            }
            else if(range.length)
            {
                for(var l in range)
                {
                    includeParts.push(range[l])
                }
            }
            itemResults.push(includeParts.join(","))
        }

        if(resArr.length)
        {
            var lastVal = -1;
            var includeParts = []
            var range = []
            for(var i in resArr)
            {
                if(lastVal + 1 == resArr[i] )
                {
                    range.push(resArr[i])
                }
                else
                {
                    if(range.length > 2)
                    {
                        includeParts.push(range[0] + "-" + range[range.length-1])
                    }
                    else if(range.length)
                    {
                        for(var l in range)
                        {
                            includeParts.push(range[l])
                        }
                    }
                    range = [resArr[i]]
                }

                lastVal = resArr[i]
            }

            if(range.length > 2)
            {
                includeParts.push(range[0] + "-" + range[range.length-1])
            }
            else if(range.length)
            {
                for(var l in range)
                {
                    includeParts.push(range[l])
                }
            }

            itemResults.push(includeParts.join(","))
        }

        var minLength = 99999;
        var minLengthResult = "";
        for(var i in itemResults)
        {
            if(itemResults[i].length < minLength )
            {
                minLength = itemResults[i].length
                minLengthResult = itemResults[i]
            }
        }

        return minLengthResult;
    }

    this.setValue = function()
    {
        //
        // DaysOfWeek
        //
        var DaysOfWeek = []
        for(var i in this.model.DaysOfWeek)
        {
            if(this.model.DaysOfWeek[i])
            {
                DaysOfWeek.push(i/1);
            }
        }
        this.model.DaysOfWeekStr = this.compileItem(DaysOfWeek, 0, 6);

        //
        // Months
        //
        var Months = []
        for(var i in this.model.Months)
        {
            if(this.model.Months[i])
            {
                Months.push(i/1);
            }
        }
        this.model.MonthsStr = this.compileItem(Months, 1, 12);

        //
        // DayOfMonth
        //
        var DayOfMonth = []
        for(var i in this.model.DayOfMonth)
        {
            if(this.model.DayOfMonth[i])
            {
                DayOfMonth.push(i/1);
            }
        }
        this.model.DayOfMonthStr = this.compileItem(DayOfMonth, 1, 31);

        //
        // Hours
        //
        var Hours = []
        for(var i in this.model.Hours)
        {
            if(this.model.Hours[i])
            {
                Hours.push(i/1);
            }
        }
        this.model.HoursStr = this.compileItem(Hours, 0, 23);

        //
        // Minutes
        //
        var Minutes = []
        for(var i in this.model.Minutes)
        {
            if(this.model.Minutes[i])
            {
                Minutes.push(i/1);
            }
        }
        this.model.MinutesStr = this.compileItem(Minutes, 0, 59);

        this.value =  this.model.MinutesStr
            + " " + this.model.HoursStr
            + " " + this.model.DayOfMonthStr
            + " " + this.model.MonthsStr
            + " " + this.model.DaysOfWeekStr;

        $("#"+this.element_id).val(this.value)
    }
}

function set_api_options(options)
{
    let additional_options = "";
    if (options.readOnly) {
        additional_options += "readonly disabled "
    }

    if (options.minLength) {
        additional_options += "minlength=" + options.minLength + " "
    }

    if (options.maxLength) {
        additional_options += "maxlength=" + options.maxLength + " "
    }

    if (/^Required/.test(options.description)) {
        additional_options += "required "
    }

    if (options.default) {
        additional_options += "placeholder=" + options.default + " "
    }

    if (options.pattern) {
        additional_options += "pattern=" + options.pattern + " "
    }

    return additional_options;
}

function getInfoFromAdditionalProperties(options)
{
    let obj, value_field, view_field;

    if(options.additionalProperties.$ref)
    {
        obj = getObjectBySchema(options.additionalProperties.$ref);
    }

    if(options.additionalProperties.model && options.additionalProperties.model.$ref)
    {
        obj = getObjectBySchema(options.additionalProperties.model.$ref);
    }

    if(options.additionalProperties.value_field && options.additionalProperties.view_field)
    {
        value_field = options.additionalProperties.value_field;
        view_field = options.additionalProperties.view_field;
    }

    return {
        obj: obj,
        value_field: value_field,
        view_field: view_field,
    }
}

function getFiltersForAutocomplete(list, search_str, view_field)
{
    let filters = spajs.urlInfo.data.reg;
    if(filters.parent_type && filters.parent_id)
    {
        let parent_model = api.openapi.definitions['One' + capitalizeString(filters.parent_type)];
        if(parent_model && parent_model.properties[list.view.bulk_name])
        {
            filters = {};
        }
    }

    filters['query'] = {};

    if(search_str)
    {
        filters['query'][view_field] = search_str;
    }

    // filters.limit = 9999;

    return filters;
}

/**
 *
 TYPE_OBJECT = "object"  #:
 TYPE_STRING = "string"  #:
 TYPE_NUMBER = "number"  #:
 TYPE_INTEGER = "integer"  #:
 TYPE_BOOLEAN = "boolean"  #:
 TYPE_ARRAY = "array"  #:
 TYPE_FILE = "file"  #:

 # officially supported by Swagger 2.0 spec
 FORMAT_DATE = "date"  #:
 FORMAT_DATETIME = "date-time"  #:
 FORMAT_PASSWORD = "password"  #:
 FORMAT_BINARY = "binary"  #:
 FORMAT_BASE64 = "bytes"  #:
 FORMAT_FLOAT = "float"  #:
 FORMAT_DOUBLE = "double"  #:
 FORMAT_INT32 = "int32"  #:
 FORMAT_INT64 = "int64"  #:

 # defined in JSON-schema
 FORMAT_EMAIL = "email"  #:
 FORMAT_IPV4 = "ipv4"  #:
 FORMAT_IPV6 = "ipv6"  #:
 FORMAT_URI = "uri"  #:

 # pulled out of my ass
 FORMAT_UUID = "uuid"  #:
 FORMAT_SLUG = "slug"  #:
 FORMAT_DECIMAL = "decimal"
 *
 */