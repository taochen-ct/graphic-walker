import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction, set } from 'mobx';
import { useTranslation } from 'react-i18next';

import { useVizStore } from '../../store';
import { GLOBAL_CONFIG } from '../../config';
import { IConfigScale, IVisualConfig, IVisualLayout } from '../../interfaces';
import Toggle from '../toggle';
import { ColorSchemes, extractRGBA } from './colorScheme';
import { DomainScale, RangeScale } from './range-scale';
import { ConfigItemContainer, ConfigItemContent, ConfigItemHeader, ConfigItemTitle } from './config-item';
import { KVTuple } from '../../models/utils';
import { isNotEmpty } from '../../utils';
import { timezones } from './timezone';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogNormalContent } from '../ui/dialog';
import Combobox from '../dropdownSelect/combobox';
import { StyledPicker } from '../color-picker';
import { ErrorBoundary } from 'react-error-boundary';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';

const DEFAULT_COLOR_SCHEME = ['#5B8FF9', '#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3', '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF'];

function useDomainScale() {
    const [enableMinDomain, setEnableMinDomain] = useState(false);
    const [enableMaxDomain, setEnableMaxDomain] = useState(false);
    const [domainMin, setDomainMin] = useState(0);
    const [domainMax, setDomainMax] = useState(100);
    const [enableType, setEnableType] = useState(false);
    const [type, setType] = useState<'linear' | 'log' | 'pow' | 'sqrt' | 'symlog'>('linear');
    const setValue = useCallback((value: IConfigScale) => {
        setEnableMaxDomain(isNotEmpty(value.domainMax));
        setEnableMinDomain(isNotEmpty(value.domainMin));
        setEnableType(isNotEmpty(value.type));
        setDomainMin(value.domainMin ?? 0);
        setDomainMax(value.domainMax ?? 100);
        setType(value.type ?? 'linear');
    }, []);

    const value = useMemo(
        () => ({
            ...(enableType ? { type } : {}),
            ...(enableMaxDomain ? { domainMax } : {}),
            ...(enableMinDomain ? { domainMin } : {}),
        }),
        [enableMaxDomain && domainMax, enableMinDomain && domainMin, enableType && type]
    );
    return {
        value,
        setValue,
        enableMaxDomain,
        enableMinDomain,
        domainMax,
        domainMin,
        setEnableMinDomain,
        setEnableMaxDomain,
        setDomainMin,
        setDomainMax,
        enableType,
        type,
        setType,
        setEnableType,
    };
}

function useScale(minRange: number, maxRange: number, defaultMinRange?: number, defaultMaxRange?: number) {
    const [enableMinDomain, setEnableMinDomain] = useState(false);
    const [enableMaxDomain, setEnableMaxDomain] = useState(false);
    const [enableRange, setEnableRange] = useState(false);
    const [domainMin, setDomainMin] = useState(0);
    const [domainMax, setDomainMax] = useState(100);
    const [rangeMin, setRangeMin] = useState(defaultMinRange ?? minRange);
    const [rangeMax, setRangeMax] = useState(defaultMaxRange ?? maxRange);
    const [enableType, setEnableType] = useState(false);
    const [type, setType] = useState<'linear' | 'log' | 'pow' | 'sqrt' | 'symlog'>('linear');

    const setValue = useCallback(
        (value: IConfigScale) => {
            setEnableMaxDomain(isNotEmpty(value.domainMax));
            setEnableMinDomain(isNotEmpty(value.domainMin));
            setEnableRange(isNotEmpty(value.rangeMax) || isNotEmpty(value.rangeMin));
            setEnableType(isNotEmpty(value.type));
            setDomainMin(value.domainMin ?? 0);
            setDomainMax(value.domainMax ?? 100);
            setRangeMax(value.rangeMax ?? defaultMaxRange ?? maxRange);
            setRangeMin(value.rangeMin ?? defaultMinRange ?? minRange);
            setType(value.type ?? 'linear');
        },
        [defaultMaxRange, defaultMinRange, maxRange, minRange]
    );

    const value = useMemo(
        () => ({
            ...(enableType ? { type } : {}),
            ...(enableMaxDomain ? { domainMax } : {}),
            ...(enableMinDomain ? { domainMin } : {}),
            ...(enableRange ? { rangeMax, rangeMin } : {}),
        }),
        [enableMaxDomain && domainMax, enableMinDomain && domainMin, enableRange && rangeMax, enableRange && rangeMin, enableType && type]
    );

    return {
        type,
        setType,
        enableType,
        setEnableType,
        value,
        setValue,
        enableMaxDomain,
        enableMinDomain,
        enableRange,
        rangeMax,
        rangeMin,
        domainMax,
        domainMin,
        setEnableMinDomain,
        setEnableMaxDomain,
        setEnableRange,
        setDomainMin,
        setDomainMax,
        setRangeMin,
        setRangeMax,
    };
}

const VisualConfigPanel: React.FC = () => {
    const vizStore = useVizStore();
    const { layout, showVisualConfigPanel, config } = vizStore;
    const { t } = useTranslation();
    const formatConfigList: (keyof IVisualConfig['format'])[] = ['numberFormat', 'timeFormat', 'normalizedNumberFormat'];
    const [format, setFormat] = useState<IVisualConfig['format']>({
        numberFormat: layout.format.numberFormat,
        timeFormat: layout.format.timeFormat,
        normalizedNumberFormat: layout.format.normalizedNumberFormat,
    });
    const [resolve, setResolve] = useState<IVisualConfig['resolve']>({
        x: layout.resolve.x,
        y: layout.resolve.y,
        color: layout.resolve.color,
        opacity: layout.resolve.opacity,
        shape: layout.resolve.shape,
        size: layout.resolve.size,
    });
    const [zeroScale, setZeroScale] = useState<boolean>(layout.zeroScale);
    const [svg, setSvg] = useState<boolean>(layout.useSvg ?? false);
    const [scaleIncludeUnmatchedChoropleth, setScaleIncludeUnmatchedChoropleth] = useState<boolean>(layout.scaleIncludeUnmatchedChoropleth ?? false);
    const [showAllGeoshapeInChoropleth, setShowAllGeoshapeInChoropleth] = useState<boolean>(layout.showAllGeoshapeInChoropleth ?? false);
    const [background, setBackground] = useState<string | undefined>(layout.background);
    const [defaultColor, setDefaultColor] = useState({ r: 91, g: 143, b: 249, a: 1 });
    const [colorEdited, setColorEdited] = useState(false);
    const [displayColorPicker, setDisplayColorPicker] = useState(false);
    const [colorPalette, setColorPalette] = useState('');
    const [geoMapTileUrl, setGeoMapTileUrl] = useState<string | undefined>(undefined);
    const [displayOffset, setDisplayOffset] = useState<number | undefined>(undefined);
    const [displayOffsetEdited, setDisplayOffsetEdited] = useState(false);

    const [enabledScales, setEnabledScales] = useState<string[]>([]);
    const columnValue = useDomainScale();
    const rowValue = useDomainScale();
    const colorValue = useDomainScale();
    const thetaValue = useScale(0, 1);
    const radiusValue = useDomainScale();
    const opacityValue = useScale(0, 1, 0.3, 0.8);
    const sizeValue = useScale(0, 100);
    const scalesSet = new Set(enabledScales);

    useEffect(() => {
        setZeroScale(layout.zeroScale);
        setSvg(layout.useSvg ?? false);
        setBackground(layout.background);
        setResolve(layout.resolve);
        setDefaultColor(extractRGBA(layout.primaryColor));
        setColorEdited(false);
        setScaleIncludeUnmatchedChoropleth(layout.scaleIncludeUnmatchedChoropleth ?? false);
        setFormat({
            numberFormat: layout.format.numberFormat,
            timeFormat: layout.format.timeFormat,
            normalizedNumberFormat: layout.format.normalizedNumberFormat,
        });
        setColorPalette(layout.colorPalette ?? '');
        const enabledScales = Object.entries(layout.scale ?? {})
            .filter(([_k, scale]) => Object.entries(scale).filter(([_k, v]) => !!v).length > 0)
            .map(([k]) => k);
        setEnabledScales(enabledScales.length === 0 ? ['opacity', 'size'] : enabledScales);
        columnValue.setValue(layout.scale?.column ?? {});
        rowValue.setValue(layout.scale?.row ?? {});
        colorValue.setValue(layout.scale?.color ?? {});
        thetaValue.setValue(layout.scale?.theta ?? {});
        radiusValue.setValue(layout.scale?.radius ?? {});
        opacityValue.setValue(layout.scale?.opacity ?? {});
        sizeValue.setValue(layout.scale?.size ?? {});
        setGeoMapTileUrl(layout.geoMapTileUrl);
        setDisplayOffset(config.timezoneDisplayOffset);
        setDisplayOffsetEdited(false);
    }, [showVisualConfigPanel]);

    return (
        <Dialog
            open={showVisualConfigPanel}
            onOpenChange={() => {
                vizStore.setShowVisualConfigPanel(false);
            }}
        >
            <DialogNormalContent
                className="p-0"
                onClick={() => {
                    setDisplayColorPicker(false);
                }}
            >
                <div className="flex flex-col max-h-[calc(min(800px,90vh))] py-6">
                    <div className="overflow-y-auto flex-shrink-1 min-h-0 px-6">
                        <ConfigItemContainer>
                            <ConfigItemHeader>
                                <ConfigItemTitle>Colors</ConfigItemTitle>
                            </ConfigItemHeader>
                            <ConfigItemContent>
                                <div className="flex gap-6 flex-col md:flex-row">
                                    <div>
                                        <label className="block text-xs font-medium leading-6">{t('config.primary_color')}</label>
                                        <ErrorBoundary
                                            fallback={
                                                <div className="flex space-x-2">
                                                    <div
                                                        className="w-4 h-4"
                                                        style={{
                                                            backgroundColor: `rgba(${defaultColor.r},${defaultColor.g},${defaultColor.b},${defaultColor.a})`,
                                                        }}
                                                    />
                                                    <Input
                                                        value={defaultColor.r}
                                                        type="number"
                                                        onChange={(e) => {
                                                            setColorEdited(true);
                                                            setDefaultColor((x) => ({ ...x, r: Number(e.target.value) }));
                                                        }}
                                                    />
                                                    <Input
                                                        value={defaultColor.g}
                                                        type="number"
                                                        onChange={(e) => {
                                                            setColorEdited(true);
                                                            setDefaultColor((x) => ({ ...x, g: Number(e.target.value) }));
                                                        }}
                                                    />
                                                    <Input
                                                        value={defaultColor.b}
                                                        type="number"
                                                        onChange={(e) => {
                                                            setColorEdited(true);
                                                            setDefaultColor((x) => ({ ...x, b: Number(e.target.value) }));
                                                        }}
                                                    />
                                                </div>
                                            }
                                        >
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                }}
                                            >
                                                <div
                                                    className="w-8 h-5 border-2"
                                                    style={{ backgroundColor: `rgba(${defaultColor.r},${defaultColor.g},${defaultColor.b},${defaultColor.a})` }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setDisplayColorPicker(true);
                                                    }}
                                                ></div>
                                                <div className="absolute left-32 top-22 z-40 shadow-sm">
                                                    {displayColorPicker && (
                                                        <StyledPicker
                                                            presetColors={DEFAULT_COLOR_SCHEME}
                                                            color={defaultColor}
                                                            onChange={(color) => {
                                                                setColorEdited(true);
                                                                setDefaultColor({
                                                                    ...color.rgb,
                                                                    a: color.rgb.a ?? 1,
                                                                });
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </ErrorBoundary>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium leading-6">{t('config.color_palette')}</label>
                                        <Combobox
                                            className="w-48 h-fit"
                                            popClassName="w-48"
                                            selectedKey={colorPalette}
                                            onSelect={setColorPalette}
                                            placeholder={t('config.default_color_palette')}
                                            options={ColorSchemes.map((scheme) => ({
                                                value: scheme.name,
                                                label: (
                                                    <>
                                                        <div key={scheme.name} className="flex flex-col justify-start items-center w-32">
                                                            <div className="font-light">{scheme.name}</div>
                                                            <div className="flex w-full">
                                                                {scheme.value.map((c, index) => {
                                                                    return <div key={index} className="h-4 flex-1" style={{ backgroundColor: `${c}` }}></div>;
                                                                })}
                                                            </div>
                                                        </div>
                                                    </>
                                                ),
                                            })).concat({
                                                value: '_none',
                                                label: <>{t('config.default_color_palette')}</>,
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium leading-6">
                                            {t('config.background')} {t(`config.color`)}
                                        </label>
                                        <Input
                                            type="text"
                                            value={background ?? ''}
                                            onChange={(e) => {
                                                setBackground(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </ConfigItemContent>
                        </ConfigItemContainer>
                        <ConfigItemContainer>
                            <ConfigItemHeader>
                                <div className="flex justify-between items-center">
                                    <ConfigItemTitle>Scale</ConfigItemTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline">Select Scale</Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {['row', 'column', 'color', 'theta', 'radius', 'opacity', 'size'].map((scale) => (
                                                <DropdownMenuCheckboxItem
                                                    key={scale}
                                                    checked={scalesSet.has(scale)}
                                                    onCheckedChange={(e) => {
                                                        if (e) {
                                                            setEnabledScales((s) => [...s, scale]);
                                                        } else {
                                                            setEnabledScales((s) => s.filter((x) => x !== scale));
                                                        }
                                                    }}
                                                >
                                                    {t(`config.${scale}`)}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </ConfigItemHeader>
                            <ConfigItemContent>
                                {scalesSet.has('column') && (
                                    <div>
                                        <label className="block text-xs font-medium leading-6">{t('config.column')}</label>
                                        <DomainScale {...columnValue} text="column" />
                                    </div>
                                )}
                                {scalesSet.has('row') && (
                                    <div>
                                        <label className="block text-xs font-medium leading-6">{t('config.row')}</label>
                                        <DomainScale {...rowValue} text="row" />
                                    </div>
                                )}
                                {scalesSet.has('color') && (
                                    <div>
                                        <label className="block text-xs font-medium leading-6">{t('config.color')}</label>
                                        <DomainScale {...colorValue} text="color" />
                                    </div>
                                )}
                                {scalesSet.has('theta') && (
                                    <div>
                                        <label className="block text-xs font-medium leading-6">{t('config.theta')}</label>
                                        <RangeScale {...thetaValue} text="theta" maxRange={100} minRange={0} isSlider={false} />
                                    </div>
                                )}
                                {scalesSet.has('radius') && (
                                    <div>
                                        <label className="block text-xs font-medium leading-6">{t('config.radius')}</label>
                                        <DomainScale {...radiusValue} text="radius" />
                                    </div>
                                )}
                                {scalesSet.has('opacity') && (
                                    <div>
                                        <label className="block text-xs font-medium leading-6">{t('config.opacity')}</label>
                                        <RangeScale {...opacityValue} text="opacity" maxRange={1} minRange={0} isSlider={true} />
                                    </div>
                                )}
                                {scalesSet.has('size') && (
                                    <div>
                                        <label className="block text-xs font-medium leading-6">{t('config.size')}</label>
                                        <RangeScale {...sizeValue} text="size" maxRange={100} minRange={0} isSlider={false}/>
                                    </div>
                                )}
                            </ConfigItemContent>
                        </ConfigItemContainer>
                        <ConfigItemContainer>
                            <ConfigItemHeader>
                                <ConfigItemTitle>{t('config.format')}</ConfigItemTitle>
                                <p className="text-xs">
                                    {t(`config.formatGuidesDocs`)}:{' '}
                                    <a target="_blank" className="hover:underline text-primary" href="https://github.com/d3/d3-format#locale_format">
                                        {t(`config.readHere`)}
                                    </a>
                                </p>
                            </ConfigItemHeader>
                            <ConfigItemContent>
                                <div className="flex gap-4">
                                    {formatConfigList.map((fc) => (
                                        <div className="my-2" key={fc}>
                                            <label className="block text-xs font-medium leading-6">{t(`config.${fc}`)}</label>
                                            <div className="mt-1">
                                                <Input
                                                    type="text"
                                                    value={format[fc] ?? ''}
                                                    onChange={(e) => {
                                                        setFormat((f) => ({
                                                            ...f,
                                                            [fc]: e.target.value,
                                                        }));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ConfigItemContent>
                        </ConfigItemContainer>
                        <ConfigItemContainer>
                            <ConfigItemHeader>
                                <ConfigItemTitle>{t('config.independence')}</ConfigItemTitle>
                            </ConfigItemHeader>
                            <ConfigItemContent>
                                <div className="flex gap-x-6 gap-y-2 flex-wrap">
                                    {GLOBAL_CONFIG.POSITION_CHANNEL_CONFIG_LIST.map((pc) => (
                                        <Toggle
                                            label={t(`config.${pc}`)}
                                            key={pc}
                                            enabled={resolve[pc] ?? false}
                                            onChange={(e) => {
                                                setResolve((r) => ({
                                                    ...r,
                                                    [pc]: e,
                                                }));
                                            }}
                                        />
                                    ))}
                                    {GLOBAL_CONFIG.NON_POSITION_CHANNEL_CONFIG_LIST.map((npc) => (
                                        <Toggle
                                            label={t(`constant.draggable_key.${npc}`)}
                                            key={npc}
                                            enabled={resolve[npc] ?? false}
                                            onChange={(e) => {
                                                setResolve((r) => ({
                                                    ...r,
                                                    [npc]: e,
                                                }));
                                            }}
                                        />
                                    ))}
                                </div>
                            </ConfigItemContent>
                        </ConfigItemContainer>
                        <ConfigItemContainer>
                            <ConfigItemHeader>
                                <ConfigItemTitle>{t('config.misc')}</ConfigItemTitle>
                            </ConfigItemHeader>
                            <ConfigItemContent>
                                <div className="flex flex-col space-y-2">
                                    <div className="flex flex-col space-y-2">
                                        <Toggle
                                            label={t(`config.customTile`)}
                                            enabled={isNotEmpty(geoMapTileUrl)}
                                            onChange={(e) => {
                                                setGeoMapTileUrl(e ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' : undefined);
                                            }}
                                        />
                                        {isNotEmpty(geoMapTileUrl) && (
                                            <Input
                                                type="text"
                                                value={geoMapTileUrl}
                                                onChange={(e) => {
                                                    setGeoMapTileUrl(e.target.value);
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="flex gap-x-6 gap-y-2 flex-wrap">
                                        <Toggle
                                            label={t(`config.zeroScale`)}
                                            enabled={zeroScale}
                                            onChange={(en) => {
                                                setZeroScale(en);
                                            }}
                                        />
                                        <Toggle
                                            label={t(`config.svg`)}
                                            enabled={svg}
                                            onChange={(en) => {
                                                setSvg(en);
                                            }}
                                        />
                                        <Toggle
                                            label="include unmatched choropleth in scale"
                                            enabled={scaleIncludeUnmatchedChoropleth}
                                            onChange={(en) => {
                                                setScaleIncludeUnmatchedChoropleth(en);
                                            }}
                                        />
                                        <Toggle
                                            label="include shapes without data"
                                            enabled={showAllGeoshapeInChoropleth}
                                            onChange={(en) => {
                                                setShowAllGeoshapeInChoropleth(en);
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        <Toggle
                                            label={t(`config.customOffset`)}
                                            enabled={isNotEmpty(displayOffset)}
                                            onChange={(e) => {
                                                setDisplayOffsetEdited(true);
                                                setDisplayOffset(e ? new Date().getTimezoneOffset() : undefined);
                                            }}
                                        />
                                        {isNotEmpty(displayOffset) && (
                                            <Combobox
                                                className="w-full"
                                                popClassName="w-[400px]"
                                                selectedKey={`${displayOffset}`}
                                                onSelect={(e) => {
                                                    setDisplayOffsetEdited(true);
                                                    setDisplayOffset(parseInt(e));
                                                }}
                                                options={timezones.map((tz) => ({
                                                    value: `${tz.value}`,
                                                    label: <span title={tz.name}>{tz.name}</span>,
                                                }))}
                                            />
                                        )}
                                    </div>
                                </div>
                            </ConfigItemContent>
                        </ConfigItemContainer>
                    </div>
                    <DialogFooter className="gap-2 mt-4 px-6">
                        <Button
                            variant="outline"
                            onClick={() => {
                                vizStore.setShowVisualConfigPanel(false);
                            }}
                        >
                            {t('actions.cancel')}
                        </Button>
                        <Button
                            onClick={() => {
                                runInAction(() => {
                                    vizStore.setVisualLayout(
                                        ['format', format],
                                        ['zeroScale', zeroScale],
                                        ['scaleIncludeUnmatchedChoropleth', scaleIncludeUnmatchedChoropleth],
                                        ['showAllGeoshapeInChoropleth', showAllGeoshapeInChoropleth],
                                        ['background', background],
                                        ['resolve', resolve],
                                        ['colorPalette', colorPalette],
                                        ['useSvg', svg],
                                        [
                                            'scale',
                                            {
                                                opacity: opacityValue.value,
                                                size: sizeValue.value,
                                                column: columnValue.value,
                                                row: rowValue.value,
                                                color: colorValue.value,
                                                theta: thetaValue.value,
                                                radius: radiusValue.value,
                                            },
                                        ],
                                        ...(colorEdited
                                            ? [
                                                  [
                                                      'primaryColor',
                                                      `rgba(${defaultColor.r},${defaultColor.g},${defaultColor.b},${defaultColor.a})`,
                                                  ] as KVTuple<IVisualLayout>,
                                              ]
                                            : []),
                                        ['geoMapTileUrl', geoMapTileUrl]
                                    );
                                    displayOffsetEdited && vizStore.setVisualConfig('timezoneDisplayOffset', displayOffset);
                                    vizStore.setShowVisualConfigPanel(false);
                                });
                            }}
                        >
                            {t('actions.confirm')}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogNormalContent>
        </Dialog>
    );
};

export default observer(VisualConfigPanel);
