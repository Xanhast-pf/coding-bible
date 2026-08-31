const recommendedProjectFiles = 2_500;
const recommendedProjectBytes = 32 * 1024 * 1024;
const projectReadConcurrency = 24;

export interface BrowserProjectReadProgress {
  completed: number;
  total: number;
}

export interface ProjectReadCandidate {
  file: Pick<File, "text">;
  fileName: string;
}

export interface ProjectReadOptions {
  onProgress?: (progress: BrowserProjectReadProgress) => void;
  signal?: AbortSignal;
}

export interface ProjectReadFile {
  fileName: string;
  source: string;
}

export const formatByteSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const getProjectResourceWarning = (
  fileCount: number,
  totalBytes: number,
) => {
  if (
    fileCount <= recommendedProjectFiles &&
    totalBytes <= recommendedProjectBytes
  ) {
    return null;
  }

  return `${fileCount.toLocaleString()} text files · ${formatByteSize(totalBytes)}. Analysis is still allowed, but it may temporarily use significant CPU and memory.`;
};

export const readProjectFiles = async (
  candidates: readonly ProjectReadCandidate[],
  { onProgress, signal }: ProjectReadOptions = {},
): Promise<readonly ProjectReadFile[]> => {
  const files = new Array<ProjectReadFile>(candidates.length);
  let completed = 0;
  let nextIndex = 0;

  const readNext = async () => {
    while (nextIndex < candidates.length) {
      signal?.throwIfAborted();

      const index = nextIndex;
      nextIndex += 1;
      const candidate = candidates[index];
      if (!candidate) {
        continue;
      }

      const source = await candidate.file.text();
      signal?.throwIfAborted();
      files[index] = {
        fileName: candidate.fileName,
        source,
      };
      completed += 1;
      onProgress?.({ completed, total: candidates.length });
    }
  };

  const readerCount = Math.min(projectReadConcurrency, candidates.length);
  await Promise.all(Array.from({ length: readerCount }, () => readNext()));

  return files;
};
