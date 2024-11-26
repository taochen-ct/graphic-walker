import React from 'react';
import {Draggable} from '@kanaries/react-beautiful-dnd';
import {observer} from 'mobx-react-lite';
import DataTypeIcon from '../../components/dataTypeIcon';
import {FieldPill} from './fieldPill';
import {refMapper} from '../fieldsContext';
import {getFieldIdentifier} from '@/utils';
import {IViewField} from "@/interfaces";
import {useVizStore} from "@/store";

export interface IFilterFieldsProps {
    filtersFiled: IViewField[]
    analysisType: "measures" | "dimensions"
}


const FilterFields: React.FC<IFilterFieldsProps> = (props: IFilterFieldsProps) => {
    const vizStore = useVizStore()
    const {filtersFiled, analysisType} = props;

    const actionChannel = (t: string): "measures" | "dimensions" => {
        if (analysisType) {
            return analysisType
        }
        return t === "measure" ? "measures" : "dimensions"
    }

    const getIndex = (f: IViewField) => {
        return vizStore.currentEncodings[actionChannel(f.analyticType)].findIndex(item => item.fid === f.fid)
    }
    return (
        <div className="touch-none">
            {filtersFiled.map((f, index) => (
                <Draggable key={`search_${getFieldIdentifier(f)}`}
                           draggableId={`search_${getFieldIdentifier(f)}`}
                           index={getIndex(f)}>
                    {(provided, snapshot) => {
                        return (
                            <>
                                <FieldPill
                                    className={`touch-none flex pt-0.5 pb-0.5 pl-2 pr-2 mx-0 m-1 text-xs hover:bg-measure/20 rounded-md truncate border border-transparent ${
                                        snapshot.isDragging ? 'bg-measure/20' : ''
                                    }`}
                                    isDragging={snapshot.isDragging}
                                    ref={refMapper(provided.innerRef)}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                >
                                    <DataTypeIcon dataType={f.semanticType} analyticType={f.analyticType}/>
                                    <span className="ml-0.5" title={f.name}>
                                        {f.name}
                                    </span>
                                </FieldPill>
                                {
                                    <FieldPill
                                        className={`pt-0.5 pb-0.5 pl-2 pr-2 mx-0 m-1 text-xs hover:bg-measure/20 rounded-md border-measure border truncate ${
                                            snapshot.isDragging ? 'bg-measure/20 flex' : 'hidden'
                                        }`}
                                        isDragging={snapshot.isDragging}
                                    >
                                        <DataTypeIcon dataType={f.semanticType} analyticType={f.analyticType}/>
                                        <span className="ml-0.5" title={f.name}>
                                            {f.name}
                                        </span>
                                    </FieldPill>
                                }
                            </>
                        );
                    }}
                </Draggable>
            ))}
        </div>
    );
};

export default observer(FilterFields);
