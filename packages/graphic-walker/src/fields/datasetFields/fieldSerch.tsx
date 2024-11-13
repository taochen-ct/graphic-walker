import React, {useState, useRef, useEffect, useCallback} from 'react';
import {Droppable} from '@kanaries/react-beautiful-dnd';
import {useTranslation} from 'react-i18next';
import FilterFields, {IFilterFieldsProps} from './filterFields';
import {refMapper} from '../fieldsContext';
import {useVizStore} from "@/store";
import {Input} from "@/components/ui/input";
import debounce from 'lodash-es/debounce';
import {IViewField} from "@/interfaces";


const FilterFieldDroppable: React.FC<IFilterFieldsProps> = (props: IFilterFieldsProps) => {
    const filtersFiled = {
        dimensions: props.filtersFiled.filter(f => f.analyticType === "dimension"),
        measures: props.filtersFiled.filter(f => f.analyticType === "measure")
    }
    // console.log(filtersFiled)
    return (
        <div className="overflow-y-auto max-h-[260px]">

            {filtersFiled.dimensions.length > 0 && <Droppable droppableId="dimensions" direction="vertical">
                {(provided, snapshot) => (
                    <div className="flex-shrink flex-grow min-w-[0px] min-h-[10px]" {...provided.droppableProps}
                         ref={refMapper(provided.innerRef)}>
                        <div className="border-t flex-grow pd-1 overflow-y-auto">
                            <FilterFields filtersFiled={filtersFiled.dimensions} analysisType={"dimensions"}/>
                        </div>
                    </div>
                )}
            </Droppable>}


            {filtersFiled.measures.length > 0 && <Droppable droppableId="measures" direction="vertical">
                {(provided, snapshot) => (
                    <div className="flex-shrink flex-grow min-w-[0px] min-h-[10px]" {...provided.droppableProps}
                         ref={refMapper(provided.innerRef)}>
                        <div className="border-t flex-grow pd-1 overflow-y-auto">
                            <FilterFields filtersFiled={filtersFiled.measures} analysisType={"measures"}/>
                        </div>
                    </div>
                )}
            </Droppable>}
        </div>
    )
}


const DatasetFieldsFilter: React.FC = (props) => {
    const vizStore = useVizStore();
    const {t} = useTranslation('translation', {keyPrefix: 'main.tabpanel.DatasetFields'});
    const fieldsList = useRef<IViewField[]>([]);
    const [inputValue, setInputValue] = useState<string>("");
    const [filteredOptions, setFilteredOptions] = useState<IViewField[]>([]);

    useEffect(() => {
        fieldsList.current = [vizStore.measures, vizStore.dimensions].reduce((acc, curr) => acc.concat(curr), [])
    }, [vizStore.dimensions, vizStore.measures]);
    const handleBlur = () => {
        // setInputValue("");
        // filteredOptions.current = []
    };
    const handleFocus = (e) => {
        // if (e.target.value) {
        //     setInputValue("");
        // }
    }
    const handleChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        handleInputChange(value);
    }

    const handleInputChange = useCallback(
        debounce((value) => {
            if (!value) {
                setFilteredOptions([])
                return
            }
            const _result = fieldsList.current.filter(option =>
                option.name.toLowerCase().includes(value.toLowerCase())
            )
            setFilteredOptions(_result)

            // console.log(filteredOptions, fieldsList, _result)
        }, 300),
        []
    )
    return <div>
        <Input
            className="pt-0.5 pb-0.5 pl-2 pr-2 my-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            type="text"
            placeholder={t("field_search")}
            id="dateset-fields-filter-input"
            autoFocus
        />
        {
            filteredOptions.length > 0 && <FilterFieldDroppable filtersFiled={filteredOptions}/>
        }
    </div>
}

export default DatasetFieldsFilter;