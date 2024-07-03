import React, { useState, useEffect } from 'react';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import * as LightningFS from '@isomorphic-git/lightning-fs';
import * as jsdiff from 'diff';
import Prism from 'prismjs';
import 'prismjs/components/prism-diff';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/themes/prism-tomorrow.css';
import * as Progress from '@radix-ui/react-progress';
import { Loader2, Download, Share2 } from 'lucide-react';
import { useRouter } from 'next/router';

const timeRanges = [
  { label: '12 hours', hours: 12 },
  { label: '1 day', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '1 week', hours: 168 },
  { label: '2 weeks', hours: 336 },
  { label: '3 weeks', hours: 504 },
  { label: '1 month', hours: 720 },
  { label: '3 months', hours: 2160 },
  { label: '6 months', hours: 4320 },
  { label: '1 year', hours: 8760 }
];

const DiffHeader = ({ fileName }) => (
  <div className="bg-gray-800 text-white p-3 rounded-t-lg">
    <h3 className="text-lg font-semibold">{fileName}</h3>
  </div>
);

const DiffContent = ({ diff }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [diff]);

  return (
    <pre className="line-numbers text-sm">
      <code className="language-diff">{diff}</code>
    </pre>
  );
};

const DiffViewer = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [fileExtensions, setFileExtensions] = useState('');
  const [timeRangeIndex, setTimeRangeIndex] = useState(3);
  const [diff, setDiff] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressPhase, setProgressPhase] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.git = git;
      window.LightningFS = LightningFS;
      setIsLoaded(true);

      // Check for URL parameters and set the state accordingly
      const { repo, extensions, start, end } = router.query;
      if (repo) setRepoUrl(decodeURIComponent(repo));
      if (extensions) setFileExtensions(decodeURIComponent(extensions));
      if (start && end) {
        setStartDate(start);
        setEndDate(end);
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const diffHours = (endTime - startTime) / (1000 * 60 * 60);
        const closestRange = timeRanges.reduce((prev, curr) => 
          Math.abs(curr.hours - diffHours) < Math.abs(prev.hours - diffHours) ? curr : prev
        );
        setTimeRangeIndex(timeRanges.indexOf(closestRange));
      }
    }
  }, [router.query]);

  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - timeRanges[timeRangeIndex].hours * 60 * 60 * 1000);
    setEndDate(end.toISOString());
    setStartDate(start.toISOString());
  }, [timeRangeIndex]);

  const fetchDiff = async () => {
    if (!isLoaded) {
      setError('Libraries not yet loaded. Please try again in a moment.');
      return;
    }

    setError('');
    setDiff([]);
    setLoading(true);
    setProgress(0);
    setProgressPhase('Initializing');

    if (!repoUrl) {
      setError('Please enter a repository URL.');
      setLoading(false);
      return;
    }

    try {
      const fs = new LightningFS('fs');
      const dir = '/repo';

      const corsProxy = 'https://cors.isomorphic-git.org';

      await git.clone({
        fs,
        http,
        dir,
        url: repoUrl,
        corsProxy,
        singleBranch: true,
        depth: 1000,
        onProgress: (event) => {
          setProgressPhase(event.phase);
          if (event.total) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        }
      });

      const logs = await git.log({ fs, dir, depth: 1000 });

      let startCommit = logs.find(log => new Date(log.commit.author.timestamp * 1000) <= new Date(startDate));
      const endCommit = logs.find(log => new Date(log.commit.author.timestamp * 1000) <= new Date(endDate)) || logs[0];

      if (!startCommit) {
        startCommit = logs[logs.length - 1];
      }

      const files = await git.listFiles({ fs, dir });
  
      const extensions = fileExtensions.split(',').map(ext => ext.trim()).filter(Boolean);
      const filteredFiles = extensions.length > 0
        ? files.filter(file => extensions.some(ext => file.endsWith(ext)))
        : files;
  
      let diffResult = [];

      for (const file of filteredFiles) {
        let oldContent = '';
        let newContent = '';
  
        try {
          const oldContentBuffer = await git.readBlob({
            fs,
            dir,
            oid: startCommit.oid,
            filepath: file,
          });
          oldContent = new TextDecoder().decode(oldContentBuffer.blob);
        } catch (error) {
          console.warn(`Failed to read old content for ${file}:`, error);
        }
  
        try {
          const newContentBuffer = await git.readBlob({
            fs,
            dir,
            oid: endCommit.oid,
            filepath: file,
          });
          newContent = new TextDecoder().decode(newContentBuffer.blob);
        } catch (error) {
          console.warn(`Failed to read new content for ${file}:`, error);
        }
  
        const fileDiff = jsdiff.createPatch(file, oldContent, newContent, startCommit.commit.author.timestamp.toString(), endCommit.commit.author.timestamp.toString());
        
        const diffLines = fileDiff.split('\n').slice(5);
        
        const hasChanges = diffLines.some(line => line.startsWith('+') || line.startsWith('-'));
        
        if (hasChanges) {
          diffResult.push({
            fileName: file,
            diff: diffLines.join('\n')
          });
        }
      }
  
      setDiff(diffResult);
    } catch (err) {
      console.error('Detailed error:', err);
      setError(`Failed to fetch diff: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateMarkdown = () => {
    let markdown = `# Diff Report for ${repoUrl}\n\n`;
    markdown += `Date Range: ${startDate} to ${endDate}\n\n`;

    diff.forEach(fileDiff => {
      markdown += `## ${fileDiff.fileName}\n\n\`\`\`diff\n${fileDiff.diff}\n\`\`\`\n\n`;
    });

    return markdown;
  };

  const downloadMarkdown = () => {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const sanitizedRepoName = repoUrl.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedRepoName}_diff_${startDate.split('T')[0]}_to_${endDate.split('T')[0]}.md`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateShareUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      repo: encodeURIComponent(repoUrl),
      extensions: encodeURIComponent(fileExtensions),
      start: startDate,
      end: endDate
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const copyShareUrl = () => {
    const shareUrl = generateShareUrl();
    
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert('Share URL copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy URL: ', err);
          fallbackCopyTextToClipboard(shareUrl);
        });
    } else {
      fallbackCopyTextToClipboard(shareUrl);
    }
  };
  
  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
  
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
  
    try {
      const successful = document.execCommand('copy');
      const msg = successful ? 'successful' : 'unsuccessful';
      console.log('Fallback: Copying text command was ' + msg);
      alert('Share URL copied to clipboard!');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      alert('Failed to copy URL to clipboard. Please copy it manually: ' + text);
    }
  
    document.body.removeChild(textArea);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="repo-url" className="block text-sm font-medium text-gray-700 mb-1">GitHub Repository URL</label>
          <input
            id="repo-url"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://github.com/username/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="file-extensions" className="block text-sm font-medium text-gray-700 mb-1">File Extensions (optional, comma-separated)</label>
          <input
            id="file-extensions"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder=".js,.py,.cpp"
            value={fileExtensions}
            onChange={(e) => setFileExtensions(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Time Range: {timeRanges[timeRangeIndex].label}</label>
        <input
          type="range"
          min="0"
          max={timeRanges.length - 1}
          value={timeRangeIndex}
          onChange={(e) => setTimeRangeIndex(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
        <div className="flex space-x-2">
          <input type="date" value={startDate.split('T')[0]} readOnly className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          <span className="self-center">to</span>
          <input type="date" value={endDate.split('T')[0]} readOnly className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={fetchDiff}
          disabled={loading || !isLoaded}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading...
            </span>
          ) : isLoaded ? 'View Diff' : 'Loading Libraries...'}
        </button>

        <button
          onClick={downloadMarkdown}
          disabled={diff.length === 0}
          className="px-4 py-2 bg-green-500 text-white rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5 inline-block mr-2" />
          Download Markdown
        </button>

        <button
          onClick={copyShareUrl}
          disabled={diff.length === 0}
          className="px-4 py-2 bg-purple-500 text-white rounded-md shadow-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-300 disabled:cursor-not-allowed"
        >
          <Share2 className="w-5 h-5 inline-block mr-2" />
          Share Results
        </button>
      </div>
      
      {loading && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-1">{progressPhase}: {progress}%</p>
          <Progress.Root className="relative overflow-hidden bg-gray-200 rounded-full w-full h-4">
            <Progress.Indicator
              className="bg-blue-500 w-full h-full transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${100 - progress}%)` }}
            />
          </Progress.Root>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

{diff.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Diff Output</h2>
          <div className="space-y-6">
            {diff.map((fileDiff, index) => (
              <div key={index} className="border rounded-lg overflow-hidden shadow-md">
                <DiffHeader fileName={fileDiff.fileName} />
                <div className="overflow-x-auto bg-gray-50">
                  <DiffContent diff={fileDiff.diff} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !loading && <p className="mt-4 text-gray-600">No changes found in the specified time range.</p>
      )}
    </div>
  );
};

export default DiffViewer;      