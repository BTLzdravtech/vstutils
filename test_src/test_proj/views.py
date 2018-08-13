from vstutils.api.serializers import VSTSerializer
from vstutils.api.base import ModelViewSetSet, Response, CopyMixin
from vstutils.api.decorators import nested_view, action
from vstutils.api import filters
from vstutils.api import fields
from .models import Host, HostGroup


class HostFilter(filters.DefaultIDFilter):
    class Meta:
        model = Host
        fields = (
            'id',
            'name',
        )


class HostGroupFilter(filters.DefaultIDFilter):
    class Meta:
        model = HostGroup
        fields = (
            'id',
        )


class HostSerializer(VSTSerializer):
    class Meta:
        model = Host
        fields = (
            'id',
            'name',
        )



class HostGroupSerializer(VSTSerializer):
    parent = fields.AutoCompletionField(autocomplete='Host', required=False)
    secret_file = fields.SecretFileInString(read_only=True)
    file = fields.FileInStringField(read_only=True)

    class Meta:
        model = HostGroup
        fields = (
            'id',
            'name',
            'parent',
            'file',
            'secret_file',
        )


class HostViewSet(ModelViewSetSet):
    model = Host
    serializer_class = HostSerializer
    filter_class = HostFilter

    @action(detail=True)
    def test(self, request, *args, **kwargs):
        return Response("OK", 200).resp

    @action(detail=True, serializer_class=HostSerializer)
    def test2(self, request, *args, **kwargs):
        self.get_object()
        return Response("OK", 201).resp

    @action(detail=True, serializer_class=HostSerializer)
    def test3(self, request, *args, **kwargs):
        return Response("OK", 201).resp


class _HostGroupViewSet(ModelViewSetSet):
    model = HostGroup
    serializer_class = HostGroupSerializer
    serializer_class_one = HostGroupSerializer
    filter_class = HostGroupFilter

@nested_view('subgroups', 'id', view=_HostGroupViewSet, subs=None)
@nested_view('hosts', 'id', view=HostViewSet)
@nested_view('subhosts', methods=["get"], manager_name='hosts', view=HostViewSet)
@nested_view(
    'shost', 'id',
    manager_name='hosts', subs=['test', 'test2'],
    view=HostViewSet, allow_append=True
)
class HostGroupViewSet(_HostGroupViewSet, CopyMixin):
    serializer_class_one = HostGroupSerializer
    copy_related = ['hosts', 'subgroups']


try:
    @nested_view('subgroups', 'id')
    class ErrorView(_HostGroupViewSet):
        pass
except nested_view.NoView:
    pass
