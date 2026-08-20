from pydantic import BaseModel, EmailStr,ConfigDict, model_validator, ValidationError
from typing import Optional, List, Union

#child object for object list in ConvertObjectMulti
class Measure(BaseModel):
    unit: str
    value: Union[int, float]

#frontend output
class MeasureOut(BaseModel):
    result: Union[int, float]
    unit: str

#frontend object for 1 unit
class ConvertObject(BaseModel):
    from_unit: str
    to_unit: str
    value: Union[int, float]

#frontend object for n units
class ConvertObjectMulti(BaseModel):
    to_unit: str
    measures: List[Measure]
