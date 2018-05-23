from vstutils.tests import BaseTestCase, json, settings
from vstutils.urls import router
from vstutils.api.views import UserViewSet


class VSTUtilsTEstCase(BaseTestCase):
    def setUp(self):
        super(VSTUtilsTEstCase, self).setUp()

    def test_main_views(self):
        # Main
        self.get_result('get', '/')
        self.get_result('post', '/logout/', 302)
        self.get_result('post', '/login/', 200)
        self.get_result('get', '/login/', 302)
        # API
        self.assertEqual(list(self.get_result('get', '/api/').keys()), ['v1'])
        self.assertEqual(
            list(self.get_result('get', '/api/v1/').keys()),
            list(settings.API[settings.VST_API_VERSION].keys())
        )
        # 404
        self.get_result('get', '/api/v1/some/', code=404)
        self.get_result('get', '/other_invalid_url/', code=404)
        self.get_result('get', '/api/users/', code=404)
        self.get_result('get', '/api/v1/users/1000/', code=404)

    def test_uregister(self):
        router_v1 = router.routers[0][1]
        router_v1.unregister("users")
        for pattern in router_v1.get_urls():
            self.assertIsNone(pattern.regex.search("users/1/"))
        router_v1.register('users', UserViewSet)
        checked = False
        for pattern in router_v1.registry:
            if pattern[0] == 'users':
                checked = True
                self.assertEqual(pattern[1], UserViewSet)
        self.assertTrue(checked, "Not registered!")

    def test_settings_api(self):
        result = self.get_result('get', '/api/v1/settings/')
        self.assertIn('system', result)
        self.assertIn('localization', result)
        self.details_test(
            '/api/v1/settings/localization/',
            LANGUAGE_CODE=settings.LANGUAGE_CODE,
            TIME_ZONE=settings.TIME_ZONE
        )
        self.details_test('/api/v1/settings/system/', PY=settings.PY_VER)

    def test_users_api(self):
        self.list_test('/api/v1/users/', 1)
        self.details_test(
            '/api/v1/users/{}/'.format(self.user.id),
            username=self.user.username, id=self.user.id
        )
        self.get_result('delete', '/api/v1/users/{}/'.format(self.user.id), 409)

        user_data = dict(
            username="test_user", first_name="some", last_name='test', email="1@test.ru"
        )
        post_data = dict(password="some_password", **user_data)
        result = self.get_result('post', '/api/v1/users/', data=post_data)
        self.assertCheckDict(user_data, result)
        result = self.get_result('get', '/api/v1/users/{}/'.format(result['id']))
        self.assertCheckDict(user_data, result)
        self.get_result('patch', '/api/v1/users/', 405, data=dict(email=""))
        result = self.get_result('get', '/api/v1/users/{}/'.format(result['id']))
        self.assertCheckDict(user_data, result)
        user_data['first_name'] = 'new'
        post_data_dict = dict(partial=True, **user_data)
        self._check_update(
            '/api/v1/users/{}/'.format(result['id']), post_data_dict,
            method='put', **user_data
        )
        del post_data_dict['partial']
        post_data_dict['email'] = "skldjfnlkjsdhfljks"
        post_data_dict['password'] = "skldjfnlkjsdhfljks"
        post_data = json.dumps(post_data_dict)
        self.get_result(
            'patch', '/api/v1/users/{}/'.format(result['id']), data=post_data, code=400
        )
        self.get_result('delete', '/api/v1/users/{}/'.format(result['id']))
        user_data['email'] = 'invalid_email'
        post_data = dict(password="some_password", **user_data)
        self.post_result('/api/v1/users/', data=post_data, code=400)
        self.post_result('/api/v1/users/', data=user_data, code=400)
        self.post_result(
            '/api/v1/users/', data=dict(username=self.user.username), code=409
        )
        self.assertCount(self.get_model_filter('django.contrib.auth.models.User'), 1)
        url_to_user = '/api/v1/users/{}/'.format(self.user.id)
        self.change_identity(False)
        self.get_result('get', url_to_user, 403)
        user_data['email'] = 'test@test.lan'
        self.post_result('/api/v1/users/', data=user_data, code=403)
        self.assertEqual(self.get_count('django.contrib.auth.models.User'), 2)
        update_password = json.dumps(dict(password='12345'))
        self.get_result(
            'patch', '/api/v1/users/{}/'.format(self.user.id), data=update_password
        )
        self.change_identity(True)
        data = [
            dict(username="USER{}".format(i), password="123") for i in range(10)
        ]
        users_id = self.mass_create('/api/v1/users/', data, 'username')
        self.assertEqual(self.get_count('django.contrib.auth.models.User'), 13)
        comma_id_list = ",".join([str(i) for i in users_id])
        result = self.get_result('get', '/api/v1/users/?id={}'.format(comma_id_list))
        self.assertCount(users_id, result['count'])
        result = self.get_result('get', '/api/v1/users/?username=USER')
        self.assertCount(users_id, result['count'])
        result = self.get_result('get', '/api/v1/users/?username__not=USER')
        self.assertEqual(result['count'], 3)

    def test_bulk(self):
        self.get_model_filter(
            'django.contrib.auth.models.User').exclude(pk=self.user.id).delete()
        self.details_test(
            '/api/v1/_bulk/', operations_types=list(settings.BULK_OPERATION_TYPES.keys())
        )
        data = [
            dict(username="USER{}".format(i), password="123") for i in range(10)
        ]
        users_id = self.mass_create('/api/v1/users/', data, 'username')
        test_user = dict(username='test_bulk_user', password='123')
        userself_data = dict(first_name='me')
        bulk_request_data = [
            # Check code 204
            {'type': 'del', 'item': 'users', 'pk': users_id[0]},
            # Check code 404
            {'type': 'del', 'item': 'users', 'pk': 0},
            # Check 201 and username
            {'type': 'add', 'item': 'users', 'data': test_user},
            # Check update first_name by self
            {'type': 'set', 'item': 'users', 'pk': self.user.id, 'data': userself_data},
            # Check mods to view detail
            {'type': 'mod', 'item': 'settings', "method": "get", 'data_type': "system"}
        ]
        result = self.get_result(
            "post", "/api/v1/_bulk/", 200, data=json.dumps(bulk_request_data)
        )
        self.assertEqual(result[0]['status'], 204)
        self.assertEqual(result[1]['status'], 404)
        self.assertEqual(result[2]['status'], 201)
        self.assertEqual(result[2]['data']['username'], test_user['username'])
        self.assertEqual(result[3]['status'], 200)
        self.assertEqual(result[3]['data']['first_name'], userself_data['first_name'])
        self.assertEqual(result[4]['status'], 200)
        self.assertEqual(result[4]['data']['PY'], settings.PY_VER)

        bulk_request_data = [
            # Check unsupported media type
            {'type': 'add', 'item': 'settings', 'data': dict()},
        ]
        self.get_result(
            "post", "/api/v1/_bulk/", 415, data=json.dumps(bulk_request_data)
        )
