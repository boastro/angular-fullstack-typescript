import {PageComponent} from '@app/core/page.component';
import {OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {ClientService} from '@app/core/client-service';
import {AppSharedService} from '@app/core/app-shared.service';
import {GridOptions} from 'ag-grid-community';
import {EntityUiConfig} from "@app/core/entity-ui-config";
import {DomSanitizer, SafeStyle} from "@angular/platform-browser";
import {EntityService} from "@app/components/entity-page/entity.service";
import {TableColumn} from "@app/core/table-column";

export class EntityIndexComponent<M, C extends EntityUiConfig, S> extends PageComponent implements OnInit {
	isNewItem = false;
	form: { item: M, errorMessages: Array<string> };
	protected service: ClientService<M>;
	protected uiConfig: C;
	grid: GridOptions;
	formPanelWidth: string;
	private gridWidth: SafeStyle;
	componentsToLoad: Array<string>;
	globalSearch: string;
	globalSearchSelectedColumns: Array<string>;
	globalSearchColumns: Array<TableColumn>;
	@ViewChild('gridToolbar', {read: ViewContainerRef}) gridToolbar: ViewContainerRef;
	@ViewChild('gridForm', {read: ViewContainerRef}) gridForm: ViewContainerRef;
	@ViewChild('handsetForm', {read: ViewContainerRef}) handsetForm: ViewContainerRef;

	// ref: any;

	constructor(protected appShared: AppSharedService, uiConfig, protected sanitizer: DomSanitizer, protected entityService: EntityService) {
		super(appShared);
		// this.ref = this;
		this.entityService.formPanelIsVisible = true;
		this.componentsToLoad = 1 === 1 ? ['gridForm', 'data'] : ['gridToolbar', 'gridForm', 'data'];
		this.grid = <GridOptions>{
			context: {
				componentParent: this,
			},
			defaultColDef: {resizable: true}
		};
		uiConfig.setGridOptions(this.grid);

		this.formPanelWidth = uiConfig.formPanelWidth;
		this.gridWidth = sanitizer.bypassSecurityTrustStyle("calc(100% - " + this.formPanelWidth + ")");
		this.globalSearch = "";
		this.globalSearchSelectedColumns = [];
		this.globalSearchColumns = [];
		uiConfig.columns.forEach(column => {
			if (column.field) {
				this.globalSearchColumns.push(column);
				this.globalSearchSelectedColumns.push(column.field);
			}
		});
	}

	/**
	 * control when to show up ag-grid (when all parts are loaded)
	 * @param componentName
	 */
	componentIsLoaded(componentName) {
		if (this.componentsToLoad.length === 0) return true;
		let index = this.componentsToLoad.indexOf(componentName);
		if (index === -1) throw new Error(componentName + ' is not a valid componentName');
		this.componentsToLoad.splice(index, 1);
		console.log('component loaded', componentName);
		return false;
	}

	public gridActions(action, rowIndex, headerName) {
		let dataRow = this.grid.api.getDisplayedRowAtIndex(rowIndex);
		alert(`"Parent Component Method from ${dataRow.data.email}! ${action}`);
	}

	ngOnInit() {
		this.service.getAll().then((data) => {
			if (this.appShared.isHandset) {
				this.service.data.first();
			} else {
				setTimeout(() => {
					this.componentIsLoaded('data');
					let nodes = this.grid.api.getRenderedNodes();
					if (nodes.length) {
						nodes[0].setSelected(true);
						this.grid.api.setFocusedCell(0, '1');
					}
				});
			}
		}, console.error);

	}

	globalSearchValueChanged(newValue) {
		this.globalSearch = newValue;
		this.grid.api.setQuickFilter(newValue);
	}

	globalSearchColumnChanged() {
		this.grid.columnApi.getAllColumns().forEach(column => {
			let def = column.getColDef();
			if (this.globalSearchSelectedColumns.indexOf(def.field) > -1) def.getQuickFilterText = undefined;
			else def.getQuickFilterText = () => '';
		});
		this.grid.api.onFilterChanged();
	}


	gridSelectionChanged(event: any) {
		//this will be mapped to entity-form.gridSelectionChanged method
	}

	toggleShowPanel() {
		this.entityService.formPanelIsVisible = !this.entityService.formPanelIsVisible;
		this.formPanelWidth = this.entityService.formPanelIsVisible ? this.uiConfig.formPanelWidth : "0px";
		this.gridWidth = this.sanitizer.bypassSecurityTrustStyle("calc(100% - " + this.formPanelWidth + ")");
	}

}
