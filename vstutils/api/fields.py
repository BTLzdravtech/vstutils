from rest_framework.serializers import CharField


class FileInStringField(CharField):
    '''
    File type which saves as string.
    '''


class SecretFileInString(FileInStringField):
    '''
    File type which saves as string and should be hidden.
    '''
    def __init__(self, **kwargs):
        kwargs['style'] = {'input_type': 'password'}
        super(SecretFileInString, self).__init__(**kwargs)


class AutoCompletionField(CharField):
    '''
    Field with autocomplite from list of objects.
    '''
    def __init__(self, **kwargs):
        self.autocomplete = kwargs.pop('autocomplete')
        self.autocomplete_property = None
        if not isinstance(self.autocomplete, (list, tuple)):
            self.autocomplete_property = kwargs.pop('autocomplete_property', 'id')
            self.autocomplete_represent = kwargs.pop('autocomplete_represent', 'name')
        super(AutoCompletionField, self).__init__(**kwargs)


class DependEnumField(CharField):
    '''
    Field based on another field.
    '''
    def __init__(self, **kwargs):
        self.field = kwargs.pop('field')
        self.choices = kwargs.pop('choices')
        super(DependEnumField, self).__init__(**kwargs)

    def to_internal_value(self, data):
        return data

    def to_representation(self, value):
        return value


class TextareaField(CharField):
    '''
    Field contained multiline string
    '''


class HtmlField(CharField):
    '''
    Field contained html-text and marked as format:html
    '''
