import React, {useState, useRef, useEffect, useCallback} from 'react';
import {Droppable} from '@kanaries/react-beautiful-dnd';
import {useTranslation} from 'react-i18next';
import FilterFields, {IFilterFieldsProps} from './filterFields';
import {refMapper} from '../fieldsContext';
import {useVizStore} from "@/store";
import {Input} from "@/components/ui/input";
import debounce from 'lodash-es/debounce';
import {IViewField} from "@/interfaces";

interface IFiltersFiled {
    dimensions: IViewField[],
    measures: IViewField[],
}

const FilterFieldDroppable: React.FC<Omit<IFilterFieldsProps, "analysisType">> = (props: Omit<IFilterFieldsProps, "analysisType">) => {
    const filtersFiled: IFiltersFiled = {
        dimensions: props.filtersFiled.filter(f => f.analyticType === "dimension"),
        measures: props.filtersFiled.filter(f => f.analyticType === "measure")
    }


    return (
        <div className="overflow-y-auto max-h-[260px]">
            {Object.keys(filtersFiled).map(key => {
                return (
                    filtersFiled[key].length > 0 &&
                    <Droppable key={`search-${key}`} droppableId={`search-${key}`} direction="vertical">
                        {(provided, snapshot) => (
                            <div className="flex-shrink flex-grow min-w-[0px] min-h-[10px]" {...provided.droppableProps}
                                 ref={refMapper(provided.innerRef)}>
                                <div className="border-t flex-grow pd-1 overflow-y-auto">
                                    <FilterFields filtersFiled={filtersFiled[key as "measures" | "dimensions"]}
                                                  analysisType={key as "measures" | "dimensions"}/>
                                </div>
                            </div>
                        )}
                    </Droppable>
                )
            })}
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

        }, 300),
        []
    )
    return <>
        <Input
            className="pt-0.5 pb-0.5 pl-2 pr-2 my-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            value={inputValue}
            onChange={(e) => {
                const value = e.target.value;
                setInputValue(value);
                handleInputChange(value);
            }}
            type="text"
            placeholder={t("field_search")}
            id="dateset-fields-filter-input"
        />
        {
            filteredOptions.length > 0 && <FilterFieldDroppable filtersFiled={filteredOptions}/>
        }
    </>
}

export default DatasetFieldsFilter;