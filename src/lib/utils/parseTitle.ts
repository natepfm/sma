

export const parseTitle = (titleFromQueryParams: string) => {
    const titleSplited = titleFromQueryParams.split("-");
    return titleSplited;
}