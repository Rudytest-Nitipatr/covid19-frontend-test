"use client"
import React, { useEffect, useState } from "react";
import {
    LineChart,
    BarChart,
    Line,
    Bar,
    XAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

type Props = {};

// Define the type for historicalData
type HistoricalData = {
    cases: Record<string, number>;
    deaths: Record<string, number>;
    recovered: Record<string, number>;
};

export default function CovidData({ }: Props) {
    const [selectedDays, setSelectedDays] = useState(30);
    const [historicalData, setHistoricalData] = useState<HistoricalData>({
        cases: {},
        deaths: {},
        recovered: {},
    });
    const [latestDataUpdate, setLatestDataUpdate] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isLoadingLatestData, setIsLoadingLatestData] = useState(true);
    const [isLoadingSortedData, setIsLoadingSortedData] = useState(true);
    const [isLoadingPagination, setIsLoadingPagination] = useState(true);
    const [chartData, setChartData] = useState<{ date: string; cases: number }[]>([]);
    const [selectedChartType, setSelectedChartType] = useState<"line" | "bar">("line");

    const renderChart = () => {
        if (selectedChartType === "line") {
            return (
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date"/>
                    <Tooltip />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="cases"
                        name="Cases"
                        stroke="rgba(75, 192, 192, 1)"
                        dot={true}
                    />
                    <Line
                        type="monotone"
                        dataKey="deaths"
                        name="Deaths"
                        stroke="rgba(255, 0, 0, 1)"
                        dot={true}
                    />
                </LineChart>
            );
        } else {
            return (
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date"/>
                    <Tooltip />
                    <Legend />
                    <Bar
                        dataKey="cases"
                        name="Cases"
                        fill="rgba(75, 192, 192, 1)"
                    />
                    <Bar
                        dataKey="deaths"
                        name="Deaths"
                        fill="rgba(255, 0, 0, 1)"
                    />
                </BarChart>
            );
        }
    };

    const formatDate = (date: string) => {
        const [month, day, year] = date.split("/");
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {

        async function fetchData() {
            try {
                setIsLoadingLatestData(true);
                setIsLoadingSortedData(true);
                setIsLoadingPagination(true);

                const result = await fetch(`https://disease.sh/v3/covid-19/historical/all?lastdays=${selectedDays}`);
                const data = await result.json();
                setHistoricalData(data);

                const latestDate = Object.keys(data.cases).pop();
                if (latestDate) {
                    setLatestDataUpdate(latestDate);
                }

                // Introduce a delay of 0.5 seconds before turning off loading
                setTimeout(() => {
                    setIsLoadingLatestData(false);
                    setIsLoadingSortedData(false);
                    setIsLoadingPagination(false);
                }, 500);
            } catch (error) {
                console.error("Error fetching data:", error);

                // Introduce a delay of 0.5 seconds before turning off loading
                setTimeout(() => {
                    setIsLoadingLatestData(false);
                    setIsLoadingSortedData(false);
                    setIsLoadingPagination(false);
                }, 500);
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

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
    };

    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const sortedDates = Object.keys(historicalData.cases).sort((a, b) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    const sortedCurrentData = sortedDates
        .slice(indexOfFirstItem, indexOfLastItem)
        .map((date) => [date, historicalData.cases[date]]);

    useEffect(() => {
        const sortedChartData = sortedDates.map((date) => ({
            date: formatDate(date),
            cases: historicalData.cases[date],
            deaths: historicalData.deaths[date],
        }));
        setChartData(sortedChartData);
    }, [sortedDates, historicalData]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">
                Total COVID-19 historical data around the world for the Last{" "}
                {selectedDays === 30
                    ? "1 Month"
                    : selectedDays === 90
                        ? "3 Months"
                        : `${selectedDays} Days`}
            </h1>
            <div className="mb-4 lg:flex lg:flex-row flex-col">
                <div className="mr-0 lg:mr-4 lg:w-1/4 mb-4 lg:mb-0 bg-white p-4 rounded-lg shadow-md">
                    {isLoadingLatestData ? (
                        <div className="my-5 animate-pulse">
                            <div className="bg-slate-200 h-4 w-40 rounded"></div>
                        </div>
                    ) : (
                        <p className="mb-2">
                            Latest data : {formatDate(latestDataUpdate as string)}
                        </p>
                    )}
                    <div className="mb-2">
                        <label htmlFor="days" className="mr-2">
                            Duration :
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
                            <option value={30}>1 Month</option>
                            <option value={90}>3 Months</option>
                        </select>
                    </div>
                    <div className="items-per-page">
                        <label htmlFor="itemsPerPage" className="mr-2">
                            Range :
                        </label>
                        <select
                            id="itemsPerPage"
                            className="bg-white border border-gray-300 rounded px-3 py-1"
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        >
                            <option value={10}>10 Columns</option>
                            <option value={30}>30 Columns</option>
                            <option value={90}>90 Columns</option>
                        </select>
                    </div>
                </div>
                <div className="w-full lg:w-3/4">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <ResponsiveContainer width="100%" height={150}>
                            {renderChart()}
                        </ResponsiveContainer>
                        <div className="mt-4 flex">
                            <button
                                className={`mr-2 ${selectedChartType === "line" ? "bg-blue-500 text-white" : "bg-gray-300"
                                    } px-3 py-1 rounded`}
                                onClick={() => setSelectedChartType("line")}
                            >
                                Line Chart
                            </button>
                            <button
                                className={`${selectedChartType === "bar" ? "bg-blue-500 text-white" : "bg-gray-300"
                                    } px-3 py-1 rounded`}
                                onClick={() => setSelectedChartType("bar")}
                            >
                                Bar Chart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto rounded-lg">
                <table className="w-full table-auto border-collapse border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th
                                className="border px-2 py-2 text-xs md:text-base"
                                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                style={{ cursor: "pointer" }}
                            >
                                Date
                                {sortOrder === "asc" ? "↓" : "↑"}
                            </th>
                            <th className="border px-2 py-2 text-xs md:text-base">Cases</th>
                            <th className="border px-2 py-2 text-xs md:text-base">Deaths</th>
                            <th className="border px-2 py-2 text-xs md:text-base">Recovered</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingSortedData
                            ? Array.from({ length: itemsPerPage }).map((_, index) => (
                                <tr key={`skeleton-${index}`}>
                                    <td className="border animate-pulse px-2 py-2 text-xs md:text-base">
                                        <div className="bg-slate-200 h-4 w-12 rounded"></div>
                                    </td>
                                    <td className="border animate-pulse px-2 py-2 text-xs md:text-base">
                                        <div className="bg-slate-200 h-4 w-12 rounded"></div>
                                    </td>
                                    <td className="border animate-pulse px-2 py-2 text-xs md:text-base">
                                        <div className="bg-slate-200 h-4 w-12 rounded"></div>
                                    </td>
                                    <td className="border animate-pulse px-2 py-2 text-xs md:text-base">
                                        <div className="bg-slate-200 h-4 w-12 rounded"></div>
                                    </td>
                                </tr>
                            ))
                            : sortedCurrentData.map(([date, casesCount]) => (
                                <tr key={date}>
                                    <td className="border px-2 py-2 text-xs md:text-base">
                                        {formatDate(date as string)}
                                    </td>
                                    <td className="border px-2 py-2 text-xs md:text-base">
                                        {String(casesCount)}
                                    </td>
                                    <td className="border px-2 py-2 text-xs md:text-base">
                                        {String(historicalData.deaths[date as string])}
                                    </td>
                                    <td className="border px-2 py-2 text-xs md:text-base">
                                        {String(historicalData.recovered[date as string])}
                                    </td>
                                </tr>
                            ))}
                    </tbody>


                </table>
                <div className="pagination flex justify-center pt-5">
                    {isLoadingPagination ? (
                        <div className="flex items-center">
                            <div className="bg-gray-300 h-4 w-16 rounded"></div>
                        </div>
                    ) : (
                        <React.Fragment>
                            <button
                                className="pagination-button px-5 rounded-lg bg-gray-300"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span className="pagination-info text-center px-8">
                                {currentPage} of {totalPages}
                            </span>
                            <button
                                className="pagination-button px-5 rounded-lg bg-gray-300"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </React.Fragment>
                    )}
                </div>
            </div>
        </div>
    );
}
