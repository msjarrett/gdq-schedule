/*
MIT License

Copyright (c) 2024 Knotty Software

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

async function loadSchedule(eventId) {
    var url =  "https://gamesdonequick.com/api/schedule/" + eventId;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            alert("Failed: ${response.status}");
            return;
        }
        const json = await response.json();
        return json;
    } catch (e) {
        alert(e);
    }
}

function countdown(now, start) {
    var timeLeft = start.getTime() - now.getTime();

    if (timeLeft < 0) return null;
    timeLeft = Math.round(timeLeft / 1000);
    if (timeLeft < 60) return timeLeft + " seconds";
    timeLeft = Math.round(timeLeft / 60);
    if (timeLeft < 120) return timeLeft + " minutes";
    timeLeft = Math.round(timeLeft / 60);
    return timeLeft + " hours";
}

function createRunDiv(run, now) {
    const divRun = document.createElement("div");
    divRun.className = "run";

    // "starttime" is a string like 2024-06-30T23:16:00-05:00. Parsed JS will
    // automagically handle timezone.
    const divTitleBlock = document.createElement("div");
    divTitleBlock.className = "runTitleBlock";
    divTitleBlock.innerHTML = `<span class="runTitle">${run.display_name}</span><br/><span class="runCategory">${run.category}</span>`
    divRun.appendChild(divTitleBlock);
    
    const divStartBlock = document.createElement("div");
    divStartBlock.className = "runStartBlock";
    const localTime = new Date(Date.parse(run.starttime));
    const timeToRun = countdown(now, localTime);
    if (timeToRun != null) {
        divStartBlock.innerHTML = `<span class="runStart">${localTime.toLocaleString()}</span><br/><span class="runCountdown">Starting in ${timeToRun}</span>`;
    } else {
        divStartBlock.innerHTML = `<span class="runStart">${localTime.toLocaleString()}</span>`;
    }
    divRun.appendChild(divStartBlock);
                
    return divRun;
}

function refreshSchedule(schedule, divSchedule) {
    divSchedule.innerHTML = "";

    const now = new Date();

    // Show up to 3 runs: the most recent that's already started, and next two upcoming.
    // Before the event, all three are upcoming, after the event we show only one in the past.
    var startRun = 0;
    const nowStamp = now.getTime();
    for (startRun = 0; startRun < schedule.length; ++startRun) {
        if (Date.parse(schedule[startRun].starttime) > nowStamp) break;
    }
    if (startRun > 0) --startRun;

    for (var i = startRun; i < Math.min(startRun + 3, schedule.length); ++i) {
        divSchedule.appendChild(createRunDiv(schedule[i], now));
    }
}

async function updateSchedule(eventId, divRoot) {
    divRoot.innerHTML = "(loading)";
    
    const marathon = await loadSchedule(eventId);

    // schedule consists of "speedrun" and "interview", but the interviews appears to be bound
    // to a speedrun (same "order"), and have minimal useful data.
    // The list appears to be pre-sorted (in ascending "order", which should translate to time).
    const schedule = marathon.schedule.filter((run) => run.type == "speedrun");

    // marathon has an 'event' and 'schedule' list.
    divRoot.innerHTML = "";
    var divTitle = document.createElement('div');
    divTitle.className = "eventTitle";
    divTitle.innerText = marathon.event.name;
    divRoot.appendChild(divTitle);

    const divUpdated = document.createElement("div");
    divUpdated.className = "lastUpdated";
    divUpdated.innerText = "Last Updated: " + (new Date()).toLocaleString("en-US");
    divRoot.appendChild(divUpdated);

    // Container element that we can reset to update the countdown.
    var divSchedule = document.createElement("div");
    divRoot.appendChild(divSchedule);

    refreshSchedule(schedule, divSchedule);
    setInterval(() => refreshSchedule(schedule, divSchedule), 15000);
}