"use client" //คอมโพเนนต์นี้ใช้งานฝั่งไคลเอนต์
import React, { useEffect, useState } from "react"; //ใช้ useEffect และ useState ร่วมกับตัวแปร
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
} from "recharts"; //ใช้ library recharts ในการทำกราฟข้อมูล

type Props = {};

// ประกาศชนิดข้อมูล
type HistoricalData = {
    cases: Record<string, number>;
    deaths: Record<string, number>;
    recovered: Record<string, number>;
};

export default function CovidData({ }: Props) {
    const [selectedDays, setSelectedDays] = useState(30); //ประกาศตัวแปรจำนวนวันที่ต้องการแสดง มีค่าเริ่มต้นเป็น30
    const [historicalData, setHistoricalData] = useState<HistoricalData>({
        cases: {},
        deaths: {},
        recovered: {},
    }); //ประกาศตัวแปรไว้เก็บข้อมูล cases, deaths และ recovered
    const [latestDataUpdate, setLatestDataUpdate] = useState<string | null>(null); //ประกาศตัวแปรแสดงวันที่ของข้อมูลล่าสุด
    const [currentPage, setCurrentPage] = useState(1); //ประกาศตัวแปรหน้าที่กำลังแสดง(pagination)
    const [itemsPerPage, setItemsPerPage] = useState(10); //ประกาศตัวแปรจำนวนข้อมูลที่ต้องการแสดงต่อหน้า มีค่าเริ่มต้นเป็น 10
    const [isLoadingLatestData, setIsLoadingLatestData] = useState(true); //ประกาศตัวแปร lazy loading แสดงระหว่างกำลังดึงข้อมูล(ข้อมูลวันที่ล่าสุด)
    const [isLoadingSortedData, setIsLoadingSortedData] = useState(true); //ประกาศตัวแปร lazy loading แสดงระหว่างกำลังดึงข้อมูล(ข้อมูลในตาราง)
    const [isLoadingPagination, setIsLoadingPagination] = useState(true); //ประกาศตัวแปร lazy loading แสดงระหว่างกำลังดึงข้อมูล(ข้อมูลจำนวนหน้า)
    const [chartData, setChartData] = useState<{ date: string; cases: number }[]>([]); //ประกาศตัวแปรข้อมูลที่จะมาใช้แสดงในกราฟ พร้อมทั้งประกาศชนิดของข้อมูล
    const [selectedChartType, setSelectedChartType] = useState<"line" | "bar">("line"); //ประกาศตัวแปรกำหนดชนิดของกราฟที่ต้องการเปลี่ยน

    // ประกาศตัวแปร ให้ข้อมูลในกราฟสัมพันธ์กับข้อมูลตามหน้าของตาราง ผ่านการควบคุมของแผงเครื่องมือ
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const slicedChartData = chartData.slice(startIndex, endIndex);

    const CustomXAxis = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={16}
                textAnchor="middle"
                fill="#666"
                transform="rotate(0)"
                fontSize="12px" // ปรับขนาดตัวอักษรตามที่ต้องการ
            >
                {payload.value}
            </text>
        </g>
    ); //กำหนดตัวแปรในการจัดการข้อมูลที่แสดงในแกน X ในที่นี้เป็นวันที่

    const renderChart = () => {
        if (selectedChartType === "line") {
            return (
                <LineChart data={slicedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={CustomXAxis} />
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
                <BarChart data={slicedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={CustomXAxis} />
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
    }; //กำหนดตัวแปรในการแสดงกราฟทั้งสองแบบ รวมไปถึงระบุข้อมูลลงไปในกราฟด้วย

    const formatDate = (date: string) => {
        const [month, day, year] = date.split("/");
        return `${day}/${month}/${year}`;
    }; //เปลี่ยนประเภทการจัดรูปแบบของวันที่ จาก เดือน/วัน/ปี เป็น วัน/เดือน/ปี

    useEffect(() => {

        async function fetchData() {
            try {
                //เรียกใช้ lazy loading ระหว่างรอโหลดข้อมูล
                setIsLoadingLatestData(true);
                setIsLoadingSortedData(true);
                setIsLoadingPagination(true);

                //เรียกข้อมูลจาก api โดยมี lastdays เป็น parameter และ selectedDays มีไว้ส่งข้อมูลจำนวนวันที่ต้องการเรียกข้อมูลให้มาแสดง
                const result = await fetch(`https://disease.sh/v3/covid-19/historical/all?lastdays=${selectedDays}`);
                const data = await result.json();
                setHistoricalData(data);

                //เรียกข้อมูลของวันที่ล่าสุดแยกออกมาจาก api (แต่ข้อมูลก็มาจาก api เป็นข้อมูลเดียวกัน)
                const latestDate = Object.keys(data.cases).pop();
                if (latestDate) {
                    setLatestDataUpdate(latestDate);
                }

                // กำหนดดีเลย์ 0.5วิ เมื่อครบกำหนดจะปิดการใช้ lazy loading
                setTimeout(() => {
                    setIsLoadingLatestData(false);
                    setIsLoadingSortedData(false);
                    setIsLoadingPagination(false);
                }, 500);
            } catch (error) {
                console.error("Error fetching data:", error);

                // กำหนดดีเลย์ 0.5วิ เมื่อครบกำหนดจะปิดการใช้ lazy loading
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
    }; //ประกาศตัวแปรรับค่าจำนวนวัน พร้อมทั้งระบุประเภทของข้อมูลให้รับได้แค่ตัวเลขเท่านั้น

    //ประกาศตัวแปรไว้ใช้กับ pagination
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

    //ประกาศตัวแปรไว้ใช้ประกอบการจัดเรียงข้อมูลผ่านการกดที่แถว Date ข้อมูลทุกช่องจะเปลี่ยนไปตามรูปแบบการจัดเรียง ในที่นี้จะเป็นการจัดเรียงจากวันที่
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const sortedDates = Object.keys(historicalData.cases).sort((a, b) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    const sortedCurrentData = sortedDates
        .slice(indexOfFirstItem, indexOfLastItem)
        .map((date) => [date, historicalData.cases[date]]);

    //ทำให้การจัดเรียงข้อมูลในกราฟเปลี่ยนไปด้วย เปลี่ยนตรงตามตาราง
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
                        latestDataUpdate && (
                            <p className="mb-2">
                                Latest data updated : {formatDate(latestDataUpdate)}
                            </p>
                        )
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
                    <div className="mt-4">
                        <label htmlFor="chartType" className="mr-2">
                            Chart :
                        </label>
                        <select
                            id="chartType"
                            className="bg-white border border-gray-300 rounded px-3 py-1"
                            value={selectedChartType}
                            onChange={(e) => setSelectedChartType(e.target.value as "line" | "bar")}
                        >
                            <option value="line">Line</option>
                            <option value="bar">Bar</option>
                        </select>
                    </div>

                </div>
                <div className="w-full lg:w-3/4">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <ResponsiveContainer width="100%" height={150}>
                            {renderChart()}
                        </ResponsiveContainer>
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
