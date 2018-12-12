import os
from vstutils.models import models
from vstutils.custom_model import ListModel, FileModel


class File(FileModel):
    file_path = os.path.dirname(__file__) + '/../custom_model.yaml'
    name = models.CharField(max_length=1024)
    for_order1 = models.IntegerField()
    for_order2 = models.IntegerField()
    origin_pos = models.AutoField(primary_key=True)

    class Meta:
        managed = False


class List(ListModel):
    data = [
        dict(id=i, value='Some data {}'.format(i))
        for i in range(100)
    ]
    id = models.IntegerField(primary_key=True)
    value = models.TextField()

    class Meta:
        managed = False


class FilesModelView(object):
    pass
