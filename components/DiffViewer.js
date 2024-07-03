import React, { useState, useEffect } from 'react';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import * as LightningFS from '@isomorphic-git/lightning-fs';
import * as jsdiff from 'diff';

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

const DiffViewer = () => {
  console.log('DiffViewer component is rendering');

  const [isLoaded, setIsLoaded] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [fileExtensions, setFileExtensions] = useState('');
  const [timeRangeIndex, setTimeRangeIndex] = useState(3);
  const [diff, setDiff] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    console.log('DiffViewer useEffect running');
    if (typeof window !== 'undefined') {
      window.git = git;
      window.LightningFS = LightningFS;
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    console.log('Window git object:', window.git);
    console.log('Window LightningFS object:', window.LightningFS);
    console.log('Imported git object:', git);
    console.log('Imported LightningFS object:', LightningFS);
  }, []);

  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - timeRanges[timeRangeIndex].hours * 60 * 60 * 1000);
    setEndDate(end.toISOString());
    setStartDate(start.toISOString());
    console.log('Date range updated:', start.toISOString(), 'to', end.toISOString());
  }, [timeRangeIndex]);

  const fetchDiff = async () => {
    if (!isLoaded) {
      console.error('Libraries not yet loaded');
      setError('Libraries not yet loaded. Please try again in a moment.');
      return;
    }

    setError('');
    setDiff('');
    setLoading(true);

    if (!repoUrl) {
      setError('Please enter a repository URL.');
      setLoading(false);
      return;
    }

    try {
      const fs = new LightningFS('fs');
      const dir = '/repo';

      console.log('Cloning from URL:', repoUrl);

      const corsProxy = 'https://cors.isomorphic-git.org';
      console.log('Using corsProxy:', corsProxy);

      console.log('Starting git clone operation...');
      await git.clone({
        fs,
        http,
        dir,
        url: repoUrl,
        corsProxy,
        singleBranch: true,
        depth: 1000,
        onProgress: (event) => {
          console.log('Git progress:', event);
        }
      });
      console.log('Git clone operation completed');
      
      console.log('Start date:', startDate);
      console.log('End date:', endDate);

      const logs = await git.log({ fs, dir, depth: 1000 });
      console.log('Total commits found:', logs.length);
      console.log('Oldest commit date:', new Date(logs[logs.length - 1].commit.author.timestamp * 1000));
      console.log('Newest commit date:', new Date(logs[0].commit.author.timestamp * 1000));

      let startCommit = logs.find(log => new Date(log.commit.author.timestamp * 1000) <= new Date(startDate));
      const endCommit = logs.find(log => new Date(log.commit.author.timestamp * 1000) <= new Date(endDate)) || logs[0];

      if (!startCommit) {
        console.warn('No commit found before the start date, using the oldest available commit');
        startCommit = logs[logs.length - 1];
      }

      console.log('Start commit:', startCommit.oid);
      console.log('End commit:', endCommit.oid);

      const files = await git.listFiles({ fs, dir });
  
      const extensions = fileExtensions.split(',').map(ext => ext.trim()).filter(Boolean);
      const filteredFiles = extensions.length > 0
        ? files.filter(file => extensions.some(ext => file.endsWith(ext)))
        : files;
  
      let diffResult = '';
  
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
        diffResult += fileDiff + '\n';
      }
  
      setDiff(diffResult);
    } catch (err) {
      console.error('Detailed error:', err);
      setError(`Failed to fetch diff: ${err.message}`);
      console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">GitHub Diff Viewer</h1>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="repo-url" className="block mb-1">GitHub Repository URL</label>
          <input
            id="repo-url"
            type="text"
            className="w-full px-3 py-2 border rounded"
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="file-extensions" className="block mb-1">File Extensions (optional, comma-separated)</label>
          <input
            id="file-extensions"
            type="text"
            className="w-full px-3 py-2 border rounded"
            placeholder=".js,.py,.cpp"
            value={fileExtensions}
            onChange={(e) => setFileExtensions(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Time Range: {timeRanges[timeRangeIndex].label}</label>
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
          <label className="block mb-1">Date Range</label>
          <div className="flex space-x-2">
            <input type="date" value={startDate.split('T')[0]} readOnly className="px-3 py-2 border rounded" />
            <span className="self-center">to</span>
            <input type="date" value={endDate.split('T')[0]} readOnly className="px-3 py-2 border rounded" />
          </div>
        </div>
        
        <button
          onClick={fetchDiff}
          disabled={loading || !isLoaded}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : isLoaded ? 'View Diff' : 'Loading Libraries...'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {diff && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Diff Output</h2>
          <div className="p-4 bg-gray-100 rounded overflow-x-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm">{diff}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffViewer;