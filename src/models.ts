export interface MdFile {
    fileName: string;
    downloadUrl: string;
    metadata: any;
}

export interface MdFileValidationResult {
    hasError: boolean;
    errors: Map<string, Array<string>>
}

export interface ReviewItem {
    relativePath: String,
    comment: String,
}