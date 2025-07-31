export interface PaginationOptions {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  totalElements: number;
  pageSizeOptions: number[];
}

export interface SortState {
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
}

export interface FilterExpansionState {
  filtersExpanded: boolean;
}

export class PaginationHelper {
  static readonly DEFAULT_PAGE_SIZE = 20;
  static readonly DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
  static readonly DEFAULT_SORT_DIRECTION: 'asc' | 'desc' = 'desc';
  static readonly DEFAULT_SORT_COLUMN = 'timestamp';

  /**
   * Create initial pagination state
   */
  static createInitialPaginationState(
    pageSize: number = PaginationHelper.DEFAULT_PAGE_SIZE,
    pageSizeOptions: number[] = PaginationHelper.DEFAULT_PAGE_SIZE_OPTIONS
  ): PaginationState {
    return {
      pageIndex: 0,
      pageSize,
      totalElements: 0,
      pageSizeOptions,
    };
  }

  /**
   * Create initial sort state
   */
  static createInitialSortState(
    sortColumn: string = PaginationHelper.DEFAULT_SORT_COLUMN,
    sortDirection: 'asc' | 'desc' = PaginationHelper.DEFAULT_SORT_DIRECTION
  ): SortState {
    return {
      sortColumn,
      sortDirection,
    };
  }

  /**
   * Create pagination options for API calls
   */
  static createPaginationOptions(
    paginationState: PaginationState,
    sortState: SortState
  ): PaginationOptions {
    return {
      page: paginationState.pageIndex,
      size: paginationState.pageSize,
      sort: sortState.sortColumn,
      direction: sortState.sortDirection,
    };
  }

  /**
   * Handle page change event
   */
  static handlePageChange(
    event: { pageIndex: number; pageSize: number },
    currentState: PaginationState
  ): PaginationState {
    return {
      ...currentState,
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
    };
  }

  /**
   * Handle sort change event
   */
  static handleSortChange(
    event: { active: string; direction: 'asc' | 'desc' },
    currentState: SortState
  ): SortState {
    return {
      sortColumn: event.active,
      sortDirection: event.direction,
    };
  }

  /**
   * Reset pagination to first page
   */
  static resetToFirstPage(currentState: PaginationState): PaginationState {
    return {
      ...currentState,
      pageIndex: 0,
    };
  }

  /**
   * Update total elements
   */
  static updateTotalElements(
    currentState: PaginationState,
    totalElements: number
  ): PaginationState {
    return {
      ...currentState,
      totalElements,
    };
  }

  /**
   * Create filter expansion state
   */
  static createFilterExpansionState(
    expanded: boolean = false
  ): FilterExpansionState {
    return {
      filtersExpanded: expanded,
    };
  }

  /**
   * Toggle filter expansion
   */
  static toggleFilterExpansion(
    currentState: FilterExpansionState
  ): FilterExpansionState {
    return {
      filtersExpanded: !currentState.filtersExpanded,
    };
  }

  /**
   * Keep filter expansion open
   */
  static keepFilterExpansionOpen(
    currentState: FilterExpansionState
  ): FilterExpansionState {
    return {
      filtersExpanded: true,
    };
  }
}
