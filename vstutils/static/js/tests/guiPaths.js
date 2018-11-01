
function rundomString(length, abc = "qwertyuiopasdfghjklzxcvbnm012364489")
{
    let res = ""
    for(let i =0; i< length; i++)
    {
        res += abc[Math.floor(Math.random()*abc.length)]
    }

    return res;
}

guiTests = {

}

/**
 * Создаёт тест который выполнит переход на страницу и завалится если там ошибка
 * @param {string} path
 */
guiTests.openPage =  function(test_name, env, path_callback)
{
    // Проверка того что страница открывается
    syncQUnit.addTest("guiPaths['"+test_name+"']", function ( assert )
    {
        let path;
        if(env === undefined)
        {
            path = test_name
        }
        else if(typeof env == "string")
        {
            path = env
        }
        else
        {
            path = path_callback(env);
        }

        let done = assert.async();
        $.when(vstGO(path)).done(() => {
            assert.ok(true, 'guiPaths["'+path+'"].opened');
            testdone(done)
        }).fail(() => {
            debugger;
            assert.ok(false, 'guiPaths["'+path+'"].opened fail');
            testdone(done)
        })
    });
}

/**
 * Создаёт тест который выполнит переход на страницу и завалится если переход выполнен без ошибки
 * @param {string} path
 */
guiTests.openError404Page =  function(env, path_callback)
{
    syncQUnit.addTest("guiPaths['openError404Page'].Error404", function ( assert )
    {
        let done = assert.async();
        let path = path_callback(env);
        $.when(vstGO(path)).always(() => {
            assert.ok($(".error-as-page.error-status-404").length != 0, 'guiPaths["'+path+'"] ok, and delete was failed');
            testdone(done)
        })
    })
}

/**
 * Попытается создать объект, выполнить переход на страницу объекта и проверить что он создался правильно
 * @param {type} path пут в апи (ждёт /user/ а не /user/new)
 * @param {type} fieldsData данные полей
 * @param {type} env в атрибут objectId этого объекта будет записан id созданного элемента
 * @param {type} isWillCreated должен ли в итоге создаться объект или ожидаем ошибку
 */
guiTests.createObject =  function(path, fieldsData, env = {}, isWillCreated = true)
{
    // Проверка того что страница с флагом api_obj.canCreate == true открывается
    syncQUnit.addTest("guiPaths['"+path+"new'] WillCreated = "+isWillCreated+", fieldsData="+JSON.stringify(fieldsData), function ( assert )
    {
        let done = assert.async();

        // Открыли страницу создания
        $.when(vstGO(path+"new")).done(() => {

            let values = guiTests.setValues(assert, fieldsData)

            // Создали объект с набором случайных данных
            $.when(window.curentPageObject.createAndGoEdit()).done(() => {

                assert.ok(isWillCreated == true, 'guiPaths["'+path+'new"] done');
                guiTests.compareValues(assert, path, fieldsData, values)

                if(window.curentPageObject.model.data.id)
                {
                    env.objectId = window.curentPageObject.model.data.id;
                }
                else if(window.curentPageObject.model.data.pk)
                {
                    env.objectId = window.curentPageObject.model.data.pk;
                }
                else if(window.curentPageObject.model.data.name)
                {
                    env.objectId = window.curentPageObject.model.data.name;
                }

                testdone(done)
            }).fail((err) => {
                assert.ok(isWillCreated == false, 'guiPaths["'+path+'new"] fail');
                testdone(done)
            })
        }).fail((err) => {
            debugger;
            assert.ok(isWillCreated == false, 'guiPaths["'+path+'new"] fail');
            testdone(done)
        })
    });
}

guiTests.updateObject =  function(path, fieldsData, isWillSaved = true)
{
    // Проверка того что страница с флагом api_obj.canCreate == true открывается
    syncQUnit.addTest("guiPaths['"+path+"update'] isWillSaved = "+isWillSaved+", fieldsData="+JSON.stringify(fieldsData), function ( assert )
    {
        let done = assert.async();

        let values = guiTests.setValues(assert, fieldsData)

        // Создали объект с набором случайных данных
        $.when(window.curentPageObject.update()).done(() => {

            assert.ok(isWillSaved == true, 'guiPaths["'+path+'update"] done');
            guiTests.compareValues(assert, path, fieldsData, values)

            testdone(done)
        }).fail((err) => {
            assert.ok(isWillSaved == false, 'guiPaths["'+path+'update"] fail');
            testdone(done)
        })

    });
}

guiTests.compareValues =  function(assert, path, fieldsData, values)
{
    for(let i in fieldsData)
    {
        let field = window.curentPageObject.model.guiFields[i]

        if(fieldsData[i].do_not_compare)
        {
            continue;
        }

        // Проверили что данные теже
        assert.ok(field.getValue() == values[i], 'test["'+path+'"]["'+i+'"] == ' + values[i]);
    }
}

guiTests.setValues =  function(assert, fieldsData)
{
    let values = []
    for(let i in fieldsData)
    {
        let field = window.curentPageObject.model.guiFields[i]
        // Наполнили объект набором случайных данных
        values[i] = field.insertTestValue(fieldsData[i].value)

        if(fieldsData[i].real_value != undefined && values[i] != fieldsData[i].real_value )
        {
            debugger;
            assert.ok(false, 'fieldsData["'+i+'"].real_value !=' + values[i]);
        }
    }

    return values
}

guiTests.deleteObject =  function(path = "deleteObject")
{
    // Проверка того что страница с флагом api_obj.canCreate == true открывается
    syncQUnit.addTest("guiPaths['"+path+"objectId'].delete", function ( assert )
    {
        let done = assert.async();
        tabSignal.once("spajs.open", () => {
            assert.ok(true, 'guiPaths["'+path+'objectId"] ok');
            testdone(done)
        })

        $(".btn-delete-one-entity").trigger('click')
    });
}

/**
 * Проверка что на странице есть кнопка удаления объекта
 * @param {type} canDelete (если true то кнопка должна быть, если false то не должна быть )
 * @param {type} path необязательный параметр для вывода в имени теста
 */
guiTests.hasDeleteButton =  function(canDelete, path = "canDeleteObject")
{
    return guiTests.hasElement(canDelete, ".btn-delete-one-entity", path)
}
guiTests.hasCreateButton =  function(isHas, path = "canDeleteObject")
{
    return guiTests.hasElement(isHas, ".btn-create-one-entity", path)
}
guiTests.hasAddButton =  function(isHas, path = "canDeleteObject")
{
    return guiTests.hasElement(isHas, ".btn-add-one-entity", path)
}



guiTests.hasElement =  function(isHas, selector, path = "canDeleteObject")
{
    syncQUnit.addTest("guiPaths['"+path+"'].hasElement['"+selector+"'] == "+isHas, function ( assert )
    {
        let done = assert.async();
        assert.ok( $(selector).length == isHas/1, 'hasElement["'+path+'"][selector='+selector+'] has ("'+$(selector).length+'") isHas == '+isHas);
        testdone(done)
    });
}
