async function gsrun(cl: any){
    const gsapi = google.sheets({version:'v4', auth: cl});

    const paidMembersSheet = {
        spreadsheetId: "SPREADSHEETID",
        range: 'Paid Members!A2:ZZ1000'
    };
    const pointSystemSheet = {
        spreadsheetId: "SPREADSHEETID",
        range: 'Point System!A1:ZZ1000'
    };
    const eventAttendanceSheet = {
        spreadsheetId: "SPREADSHEETID",
        range: 'Event Attend. F19-S20!B1:ZZ1000'
    };

    const pointDistSheet = {
        spreadsheetId: "SPREADSHEETID",
        range: 'Point Dist.!B1:ZZ1000'
    };


    let paidMembersData = (await gsapi.spreadsheets.values.get(paidMembersSheet)).data.values; // waits to receive sheet then converts into array of data
    let pointSystemData = (await gsapi.spreadsheets.values.get(pointSystemSheet)).data.values; // waits to receive sheet then converts into array of data
    let eventAttendanceData = (await gsapi.spreadsheets.values.get(eventAttendanceSheet)).data.values; // waits to receive sheet then converts into array of data
    let pointDistData = (await gsapi.spreadsheets.values.get(pointDistSheet)).data.values; // waits to receive sheet then converts into array of data

    const pointSystemUpdate = {
        spreadsheetId: '1nrTjc-12FIUwJoRe4mZ1J2DeVN5sDdCVV4BWEy9ue-I',
        range: 'Point System!A1',
        valueInputOption: 'USER_ENTERED',
        resource: {values: pointSystemData}
    };
    const eventAttendUpdate = {
        spreadsheetId: '1nrTjc-12FIUwJoRe4mZ1J2DeVN5sDdCVV4BWEy9ue-I',
        range: 'Event Attend. F19-S20!B1',
        valueInputOption: 'USER_ENTERED',
        resource: {values: eventAttendanceData}
    };

    console.log(pointDistData);
    console.log("members data collected success!");
    console.log("checking paid members list and point system list....");

    // checks for new members
    for(let payedMember = 0; payedMember < paidMembersData.length; payedMember++){
        //paidMembersData.forEach(payedMember =>
        let inSystem = false;
        for (let i = 0; i < pointSystemData.length; i++) {
            if(paidMembersData[payedMember][1] === pointSystemData[i][0]){
                inSystem = true;
            }
        }
        if(!inSystem){
            pointSystemData.push([paidMembersData[payedMember][1]]);//pushes the new members name to point system
            pointSystemData[pointSystemData.length - 1][1] = 0 ;
            console.log("Adding " + paidMembersData[payedMember][1] + " to system...")
        }
    }

    //sets all members points to 0
    for (let i = 1; i < pointSystemData.length; i++) {
        for(let j = 1; j < pointSystemData[0].length; j++){
            pointSystemData[i][j] = 0;
        }
    }


    console.log("Checking events attendance for updates...");
    //console.log(eventAttendanceData);

    //adjust event attendance array
    eventAttendanceData.push([""]); //adds extra row to check when list of attendance for each event ends
    const numberOfEvents = eventAttendanceData[0].length;

    for(let eventSheetRow = 0; eventSheetRow < eventAttendanceData.length; eventSheetRow++){
        //eventAttendanceData.forEach(eventSheetRow => {
        while(eventAttendanceData[eventSheetRow].length < numberOfEvents){
            eventAttendanceData[eventSheetRow].push("");
        }
    }
    //);

    //main loop to add up attendance
    for(let event = 0; event < eventAttendanceData[0].length; event++){ //scans through each event
        let eidIndex = 3;
        let totalAttendance = 0;

        while(eventAttendanceData[eidIndex][event] !== ''){//scans through each attendant

            for(let memberInPointSystem = 1; memberInPointSystem < pointSystemData.length; memberInPointSystem++){

                // if member in attendance is in point system, update
                if(paidMembersData[memberInPointSystem-1][3].toLowerCase() === eventAttendanceData[eidIndex][event].toLowerCase()) {
                    console.log(pointSystemData[memberInPointSystem][0]);

                    //finds specific event from attendance sheet and matches it with point system
                    for (let pointSystemEventIndex = 8; pointSystemEventIndex < pointSystemData[0].length; pointSystemEventIndex++) {

                        if (pointSystemData[0][pointSystemEventIndex] === eventAttendanceData[1][event]) {
                            console.log(pointSystemData[0][pointSystemEventIndex]);

                            pointSystemData[memberInPointSystem][pointSystemEventIndex]++;

                            for(let eventPointsIndex = 0; eventPointsIndex<pointDistData[0].length; eventPointsIndex++ ){ // updates overall points
                                if(pointDistData[1][eventPointsIndex] === pointSystemData[0][pointSystemEventIndex]){ // finds point for specific event
                                    console.log("we made it to: " + pointDistData[1][eventPointsIndex]);
                                    let pointsToAdd = parseInt(pointDistData[2][eventPointsIndex]);
                                    pointSystemData[memberInPointSystem][1] += pointsToAdd; // adds points to total
                                    for(let pillarIndex = 3; pillarIndex < 8; pillarIndex++){ // adds points to specific pillar and total points
                                        if(pointSystemData[0][pillarIndex] === pointDistData[0][eventPointsIndex] ){
                                            pointSystemData[memberInPointSystem][pillarIndex] += pointsToAdd;
                                        }
                                    }

                                }
                            }

                        }
                    }
                }
            }


            totalAttendance++;
            eidIndex++;
        }
        eventAttendanceData[2][event] = totalAttendance;
    }

    //Last, go through point system and calculate each pillar points and if eligible for end of year social.

    for(let eoyIndex = 1; eoyIndex<pointSystemData.length; eoyIndex++){
        if((pointSystemData[eoyIndex][3] > 0) && (pointSystemData[eoyIndex][4] > 0) && (pointSystemData[eoyIndex][5] > 0) && (pointSystemData[eoyIndex][6] > 0) && (pointSystemData[eoyIndex][7] > 0) ){
            pointSystemData[eoyIndex][2] = "YAS!";
        }else{
            pointSystemData[eoyIndex][2] = "NO!";
        }
    }
    gsapi.spreadsheets.values.update(eventAttendUpdate);
    gsapi.spreadsheets.values.update(pointSystemUpdate);
}
