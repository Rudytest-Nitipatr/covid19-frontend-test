"use client"
import React, { useEffect, useState } from "react";

type Props = {};

export default function Home({}: Props) {
  const [selectedDays, setSelectedDays] = useState(30);
  const [historicalData, setHistoricalData] = useState({ cases: {}, deaths: {}, recovered: {} });
  const [latestDataUpdate, setLatestDataUpdate] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formatDate = (date: string) => {
    const [month, day, year] = date.split("/");
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await fetch(`https://disease.sh/v3/covid-19/historical/all?lastdays=${selectedDays}`);
        const data = await result.json();
        setHistoricalData(data);

        // Get the latest data update date
        const latestDate = Object.keys(data.cases).pop();
        if (latestDate) {
          setLatestDataUpdate(latestDate);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();
  }, [selectedDays]);

  const handleDaysChange = (days: number) => {
    setSelectedDays(days);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = Object.entries(historicalData.cases).slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(Object.keys(historicalData.cases).length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemPerPageChange = (value: number | "all") =>{
    setItemPerPage(value);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">COVID-19 Historical Data for the Last {selectedDays} Days</h1>
      <div className="mb-4">
        {latestDataUpdate && (
          <p className="mb-2">
            Latest data update at {formatDate(latestDataUpdate)}.
          </p>
        )}
        <div className="mb-2">
          <label htmlFor="days" className="mr-2">
            Select days:
          </label>
          <select
            id="days"
            className="bg-white border border-gray-300 rounded px-3 py-1"
            value={selectedDays}
            onChange={(e) => handleDaysChange(Number(e.target.value))}
          >
            <option value={3}>3 Days</option>
            <option value={7}>7 Days</option>
            <option value={21}>21 Days</option>
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
          </select>
        </div>
        <div className="items-per-page">
          <label htmlFor="itemsPerPage" className="mr-2">
            Items per page:
          </label>
          <select
            id="itemsPerPage"
            className="bg-white border border-gray-300 rounded px-3 py-1"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={30}>30</option>
            <option value={90}>90</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-2 text-xs md:text-base">Date</th>
              <th className="border px-2 py-2 text-xs md:text-base">Cases</th>
              <th className="border px-2 py-2 text-xs md:text-base">Deaths</th>
              <th className="border px-2 py-2 text-xs md:text-base">Recovered</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map(([date, casesCount]) => (
              <tr key={date}>
                <td className="border px-2 py-2 text-xs md:text-base">{formatDate(date)}</td>
                <td className="border px-2 py-2 text-xs md:text-base">{casesCount}</td>
                <td className="border px-2 py-2 text-xs md:text-base">{historicalData.deaths[date]}</td>
                <td className="border px-2 py-2 text-xs md:text-base">{historicalData.recovered[date]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
