from fastapi import APIRouter, Depends, status, HTTPException, Response
from . import schemas
import pint
from pint.errors import DimensionalityError, UndefinedUnitError

#router initialization
router = APIRouter(tags=["Converting logic"])

#ureg entity
ureg = pint.UnitRegistry()

#convert to specific units function
def count(value, from_unit, to_unit):

    # Quantity(...) instead of `value * ureg(...)`: multiplication fails for
    # temperature units (degC, degF), the constructor works for all units
    quantity = ureg.Quantity(value, from_unit)

    converted = quantity.to(to_unit)

    return converted

# ===== ENDPOINTS =====
#convert 1 unit to another
@router.post("/convert")
def Convert(measure: schemas.ConvertObject):
    try:
        converted = count(measure.value, measure.from_unit, measure.to_unit)
        return {"result": converted.magnitude, "unit": str(converted.units)}
    except (DimensionalityError, UndefinedUnitError) as e:
        raise HTTPException(status_code=400, detail=str(e))

#convert n units to 1
@router.post("/convertMulti", response_model=schemas.MeasureOut)
def ConvertMulti(measure: schemas.ConvertObjectMulti):

    result_value = 0

    try:
        for measure_object in measure.measures:
            converted = count(measure_object.value, measure_object.unit, measure.to_unit)
            result_value += converted.magnitude
    except (DimensionalityError, UndefinedUnitError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "result": result_value,
        "unit": measure.to_unit
    }