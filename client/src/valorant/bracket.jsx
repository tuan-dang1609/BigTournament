import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css'
const images = import.meta.glob('../image/*.{png,jpg,jpeg,gif}');
const imagesagent = import.meta.glob('../agent/*.{png,jpg,jpeg,gif}');

export default function SwissStage() {
    const [data, setData] = useState(null);

    useEffect(() => {

        document.title = 'Vòng Swiss Play'
        // Close the modal when clicking outside of it
        window.onclick = function (event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = "none";
            }
        }
        const SHEET_ID = '1s2Lyk37v-hZcg7-_ag8S1Jq3uaeRR8u-oG0zviSc26E';
        const sheets = [
            { title: 'Match', range: 'A2:360', processData: processStatVongBangData },
            { title: 'Swiss Stage', range: 'A2:L53', processData: processSwissStageData },
            { title: 'Sheet3', range: 'A1:U37', processData: processLienquanAData }

        ];

        const fetchSheetData = async (title, range) => {
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${title}&range=${range}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch data from sheet: ${title}`);
            }
            const text = await response.text();
            const jsonData = JSON.parse(text.substr(47).slice(0, -2));
            return jsonData;
        };

        const fetchData = async () => {
            try {
                const fetchPromises = sheets.map(sheet => fetchSheetData(sheet.title, sheet.range));
                const results = await Promise.all(fetchPromises);
                results.forEach((data, index) => {
                    sheets[index].processData(data);
                });
            } catch (error) {
                console.error('Error occurred:', error);
            }
        };

        fetchData();
    }, []);

    const processSwissStageData = (data) => {
        let rowData = data.table.rows.slice(35, 53);
        let valueA = [];
        let valueB = [];
        let valueC = [];
        let valueD = [];
        let valueE = [];
        let valueF = [];
        let valueK = {};
        let valueL = [];
        let valueM = [];
        for (let i = 0; i < 8; i++) {
            valueA.push(data.table.rows[i]?.c[0]?.v ?? null);
            valueB.push(data.table.rows[i]?.c[1]?.v ?? null);
            valueC.push(data.table.rows[i]?.c[2]?.v ?? null);
            valueD.push(data.table.rows[i]?.c[3]?.v ?? null);
            valueE.push(data.table.rows[i]?.c[4]?.v ?? null);
            valueF.push(data.table.rows[i]?.c[5]?.v ?? null);

        }
        for (let i = 0; i < 4; i++) {
            valueK[data.table.rows[i]?.c[10]?.v ?? null] = data.table.rows[i]?.c[11]?.v ?? null;

        }
        for (let position in valueK) {
            valueL.push({ position: parseInt(position), logo: valueK[position] });
        }
        for (let i = 4; i < 8; i++) {
            valueM.push(data.table.rows[i]?.c[11]?.v ?? null);
        }
        // Create matchups container
        const matchupsContainer = document.createElement('div');
        matchupsContainer.classList.add('matchups');
        // Loop to create each matchup
        function createTeamDiv(logoSrc, score) {
            const teamDiv = document.createElement('div');
            teamDiv.classList.add('team');

            const logoTeamDiv = document.createElement('div');
            logoTeamDiv.classList.add('logo-team');
            const logoImg = document.createElement('img');
            logoImg.src = logoSrc;
            logoImg.alt = '';
            logoTeamDiv.appendChild(logoImg);
            teamDiv.appendChild(logoTeamDiv);

            const scoreDiv = document.createElement('div');
            scoreDiv.classList.add('score');
            const scoreP = document.createElement('p');
            scoreP.textContent = score;
            scoreDiv.appendChild(scoreP);
            teamDiv.appendChild(scoreDiv);

            return teamDiv;
        }
        function openModal(modalNum, group) {
            var modal = document.getElementById("myModal" + group + modalNum);
            modal.style.display = "block";
        }

        // Function to close the modal
        function closeModal(modalNum, group) {
            var modal = document.getElementById("myModal" + group + modalNum);
            modal.style.display = "none";
        }

        // Close the modal when clicking outside of it
        window.onclick = function (event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = "none";
            }
        }

        function createModal(i, rowData, group, amountplus, col) {
            const mymodelid = document.createElement('div');
            mymodelid.id = "myModal" + String(group) + String(i);
            mymodelid.classList.add('modal');
        
            const modal_content = document.createElement('div');
            modal_content.classList.add('modal-content');
            modal_content.id = 'matchid' + String(group) + String((i / 2 + 1 + amountplus));
        
            const close_span = document.createElement('span');
            close_span.classList.add('close');
            close_span.innerHTML = '&times;';
            close_span.addEventListener('click', function () { closeModal(i, group); });
        
            modal_content.appendChild(close_span);
        
            // Example of dynamically setting image sources
            const img_pick = document.createElement('div');
            img_pick.classList.add('map_pick_label');
            const img_pick1 = document.createElement('img');
            const img_pick2 = document.createElement('img');
            const img_pick3 = document.createElement('img');
            img_pick1.classList.add('map_pick');
            img_pick2.classList.add('map_pick');
            img_pick3.classList.add('map_pick');
            
            const baseIndex = (i / 2) * 3 + 1; // Adjust as needed for your context
            if (rowData[baseIndex + 2] && rowData[baseIndex + 2].c && rowData[baseIndex + 2].c[col]) {
                const imgPick1Path = rowData[baseIndex]?.c[col]?.v ? '../image/' + String(rowData[baseIndex].c[col].v) + ".jpg" : 'TBD.jpg';
                const imgPick2Path = rowData[baseIndex + 1]?.c[col]?.v ? '../image/' + String(rowData[baseIndex + 1].c[col].v) + ".jpg" : 'TBD.jpg';
                const imgPick3Path = rowData[baseIndex + 2]?.c[col]?.v ? '../image/' + String(rowData[baseIndex + 2].c[col].v) + ".jpg" : 'TBD.jpg';
        
                // Function to set image source
                const setImageSource = (imgElement, imagePath) => {
                    if (images[imagePath]) {
                        images[imagePath]().then((module) => {
                            imgElement.src = module.default;
                        }).catch(() => {
                            imgElement.src = images['../image/TBD.png']; // Fallback if the import fails
                        });
                    } else {
                        imgElement.src = images['../image/TBD.png']; // Fallback if the image path is not in the glob
                    }
                };

                setImageSource(img_pick1, imgPick1Path);
                setImageSource(img_pick2, imgPick2Path);
                setImageSource(img_pick3, imgPick3Path);
            }
            img_pick.appendChild(img_pick1);
            img_pick.appendChild(img_pick2);
            img_pick.appendChild(img_pick3);
            modal_content.appendChild(img_pick);
            const content = document.createElement('div');
            modal_content.appendChild(content);
        
            mymodelid.appendChild(modal_content);
    
        
            return mymodelid; // Return the created modal
        }
        
        function createMatchup(i, valueA, valueB, rowData, containerClass, group, amountplus, col,groupstage) {
            const container = document.querySelector(containerClass);
            const matchupsContainer = document.createElement('div');
            matchupsContainer.classList.add('matchups');
        
            const modal = createModal(i, rowData, group, amountplus, col); // Create and return modal
            matchupsContainer.appendChild(modal); // Append modal to matchupsContainer
        
            const link_info_match = document.createElement('a');
            // Update the href to use Math.floor(i / 2) + 1
            link_info_match.classList.add('link-match-info');
            link_info_match.href = '/valorant/match/'+groupstage+"/match" + (Math.floor(i / 2) + 1);
        
            const matchupDiv = document.createElement('div');
            matchupDiv.classList.add('matchup');
        
            const regex = /\/d\/(.+?)\/view/;
        
            let link_drive_image_A = valueA[i];
            const fileIdA = link_drive_image_A.match(regex)[1];
            const logoSrcA = `https://drive.google.com/thumbnail?id=${fileIdA}`;
            const team1Div = createTeamDiv(logoSrcA, valueB[i]);
            matchupDiv.appendChild(team1Div);
        
            let link_drive_image_B = valueA[i + 1];
            const fileIdB = link_drive_image_B.match(regex)[1];
            const logoSrcB = `https://drive.google.com/thumbnail?id=${fileIdB}`;
            const team2Div = createTeamDiv(logoSrcB, valueB[i + 1]);
            matchupDiv.appendChild(team2Div);
        
            link_info_match.appendChild(matchupDiv);
            matchupsContainer.appendChild(link_info_match);
            container.appendChild(matchupsContainer);
        }
        
        for (let i = 0; i < 8; i += 2) {
            createMatchup(i, valueA, valueB, rowData, '.w0-l0', "A", 0, 0,"round0-0");
        }
        for (let i = 0; i < 4; i += 2) {
            createMatchup(i, valueC, valueD, rowData, '.w1-l0', "B", 4, 1,"round1-0");
        }
        for (let i = 4; i < 8; i += 2) {
            createMatchup(i, valueC, valueD, rowData, '.w0-l1', "B", 4, 1,"round0-1");
        }
        
        for (let i = 0; i < 3; i += 2) {
            createMatchup(i, valueE, valueF, rowData, '.w1-l1', "C", 8, 2,"round1-1");
        }
        // Create eliminate-teams container
        const eli = document.querySelector('.eliminate');
        const eliminateTeamsContainer = document.createElement('div');
        eliminateTeamsContainer.classList.add('eliminate-teams');

        // Create all-teams containeradvanceTeamsContainer
        const allTeamsContainerEli = document.createElement('div');
        allTeamsContainerEli.classList.add('all-teams-eli');

        // Loop through teams and create team elements
        valueM.forEach(teamName => {
            // Create team div
            const teamDiv = document.createElement('div');
            teamDiv.classList.add('team');

            // Create logo-team div
            const logoTeamDiv = document.createElement('div');
            logoTeamDiv.classList.add('logo-team');

            // Create team image
            const teamImg = document.createElement('img');
            const regex = /\/d\/(.+?)\/view/;
            let link_drive_image = teamName; // Use even value cell
            const logoteamA = link_drive_image.match(regex);
            const fileIdA = logoteamA[1];
            teamImg.src = `https://drive.google.com/thumbnail?id=${fileIdA}`;
            teamImg.alt = '';

            // Append team image to logo-team div
            logoTeamDiv.appendChild(teamImg);

            // Append logo-team div to team div
            teamDiv.appendChild(logoTeamDiv);

            // Append team div to all-teams container
            allTeamsContainerEli.appendChild(teamDiv);
        });

        // Append all-teams container to eliminate-teams container
        eliminateTeamsContainer.appendChild(allTeamsContainerEli);

        // Append eliminate-teams container to the document body or any other desired parent element
        eli.appendChild(eliminateTeamsContainer);


        const adva = document.querySelector('.advance');
        const advanceTeamsContainer = document.createElement('div');
        advanceTeamsContainer.classList.add('advance-teams');

        // Create all-teams-win container
        const allTeamsWinContainer = document.createElement('div');
        allTeamsWinContainer.classList.add('all-teams-win');


        // Loop through teamsData and create team elements
        valueL.forEach(team => {
            // Create team div
            const teamDiv = document.createElement('div');
            teamDiv.classList.add('team');

            // Create position div
            const posDiv = document.createElement('div');
            posDiv.classList.add('pos');
            const posP = document.createElement('p');
            posP.textContent = team.position;
            posDiv.appendChild(posP);

            // Create logo-team div
            const logoTeamDiv = document.createElement('div');
            logoTeamDiv.classList.add('logo-team');

            // Create team image
            const teamImg = document.createElement('img');
            const regex = /\/d\/(.+?)\/view/;
            let link_drive_image = team.logo; // Use even value cell
            const logoteamA = link_drive_image.match(regex);
            const fileIdA = logoteamA[1];
            teamImg.src = `https://drive.google.com/thumbnail?id=${fileIdA}`;
            teamImg.alt = '';


            // Append elements to team div
            teamDiv.appendChild(posDiv);
            logoTeamDiv.appendChild(teamImg);
            teamDiv.appendChild(logoTeamDiv);

            // Append team div to all-teams-win container
            allTeamsWinContainer.appendChild(teamDiv);
        });

        // Append all-teams-win container to advance-teams container
        advanceTeamsContainer.appendChild(allTeamsWinContainer);

        // Append advance-teams container to the document body or any other desired parent element
        adva.appendChild(advanceTeamsContainer);
        setData(data);
    };

    const processStatVongBangData = async () => {
        // Process and display data for stat_vong_bang.js
        try {
            const fetchAndCreateTableRows = async (data, startIndex, targetIDStart) => {
                const dataBody = document.getElementById(targetIDStart);

                for (let i = startIndex; i < startIndex + 5; i++) {
                    const rowData = data.table.rows[i].c;
                    const row = document.createElement('tr');
                    let agent = document.createElement('img');
                    let ign_col = document.createElement('div');
                    ign_col.classList.add('first-col');
                    let IGN = document.createElement('span');
                    IGN.textContent = rowData[1].v;
                    agent.classList.add('agent-pick');
                
                    let imageagent = '../agent/'+rowData[0].v + '.png';
                    imagesagent[imageagent]().then((module) => {
                        agent.src = module.default;
                      });
                    let hs = document.createElement('td');
                    hs.textContent = rowData[6].v;
                    ign_col.appendChild(agent);
                    ign_col.appendChild(IGN);
                    let first_col = document.createElement('td');
                    first_col.appendChild(ign_col);
                    row.appendChild(first_col);
                    for (let j = 2; j < rowData.length; j++) {
                        const cell = document.createElement('td');
                        cell.textContent = rowData[j].v;
                        row.appendChild(cell);
                    }

                    dataBody.appendChild(row);
                }
            };

            const sheets = [
                { title: 'Match1', range: 'A2:L41', targetLeftStart: 1, targetRightStart: 1, rowCount: 4 },
                { title: 'Match2', range: 'A2:L121', targetLeftStart: 5, targetRightStart: 5, rowCount: 12 },
                { title: 'Match3', range: 'A2:L61', targetLeftStart: 17, targetRightStart: 17, rowCount: 6 },
            ];

            const SHEET_ID = '1s2Lyk37v-hZcg7-_ag8S1Jq3uaeRR8u-oG0zviSc26E';
            const fetchPromises = sheets.map(async (sheet) => {
                const fullURL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${sheet.title}&range=${sheet.range}`;

                const res = await fetch(fullURL);
                if (!res.ok) {
                    throw new Error(`Failed to fetch ${sheet.title} data: ${res.status} ${res.statusText}`);
                }

                const rep = await res.text();
                const data = JSON.parse(rep.substr(47).slice(0, -2));
                return { sheet, data };
            });

            const sheetsData = await Promise.all(fetchPromises);

            const processSheetPromises = sheetsData.flatMap(({ sheet, data }) => {
                const leftPromises = [];
                const rightPromises = [];
                const rowCount = sheet.rowCount; // Use the rowCount from the sheet object
                for (let i = 0; i < rowCount; i++) {
                    const targetLeftID = `team-left-A-${sheet.targetLeftStart + i}`;
                    const targetRightID = `team-right-A-${sheet.targetRightStart + i}`;
                    leftPromises.push(fetchAndCreateTableRows(data, i * 10, targetLeftID));
                    rightPromises.push(fetchAndCreateTableRows(data, (i * 10) + 5, targetRightID));
                }
                return [...leftPromises, ...rightPromises];
            });

            await Promise.all(processSheetPromises);

        } catch (error) {
            console.error('Error occurred:', error);
        }
    };

    const processLienquanAData = (data) => {
        function getGroup(i) {
            if (i < 4) return 'A';
            if (i < 8) return 'B';
            return 'C';
        }
        for (let i = 0; i < 10; i++) {
            let group = getGroup(i);
            let dataBody = document.getElementById('matchid' + group + (i + 1));

            let k = 0;
            let rowData;
            if (i === 0 || i === 1 || i === 2 || i === 3) {
                rowData = data.table.rows[i].c;
            }
            else {
                k = i + (2 * i) - 8
                rowData = data.table.rows[k].c;
            }
            
            let matchId = group + (i + 1);
            let link = document.createElement('div');
            link.classList.add('showWords1')

            let rowDiv = document.createElement('div');
            rowDiv.classList.add('row2');
            // Create a container div for each row
            let rowDiv1 = document.createElement('div');
            rowDiv1.classList.add('row1');

            // Create a team div to wrap the team logo and name
            let teamDiv1 = document.createElement('div');
            teamDiv1.classList.add('team');

            // Create an image element for the team logo
            let img1 = document.createElement('img');
            img1.classList.add('team-logo');
            const regex = /\/d\/(.+?)\/view/;
            img1.src = `https://drive.google.com/thumbnail?id=${rowData[0].v.match(regex)[1]}`; // Set the image source from the data
            img1.alt = rowData[1].v + ' Logo'; // Set the alt text based on the team name
            teamDiv1.appendChild(img1);
            let span1 = document.createElement('span');
            span1.classList.add('team-name');
            teamDiv1.appendChild(span1);
            rowDiv1.appendChild(teamDiv1);

            // Create a score container div
            let scoreContainerDiv = document.createElement('div');
            scoreContainerDiv.classList.add('score-container');

            // Create a parent span to group score-left, 'gach', score-right, and winner
            let scoreSpan = document.createElement('span');
            scoreSpan.classList.add('score');

            let span2 = document.createElement('span');
            span2.textContent = rowData[3].v;
            span2.classList.add('score-left'); // Add the 'score-left' class

            let gachSpan = document.createElement('span');
            gachSpan.textContent = '-';
            gachSpan.classList.add('gach'); // Add the 'gach' class

            let span3 = document.createElement('span');
            span3.textContent = rowData[4].v;
            span3.classList.add('score-right'); // Add the 'score-right' class

            let winnerSpan = document.createElement('span');
            let loseSpan = document.createElement('span');
            winnerSpan.classList.add('winner');
            loseSpan.classList.add('loser');
            // Check for the winner condition

            // Create a team div to wrap the team name and logo
            let teamDiv2 = document.createElement('div');
            teamDiv2.classList.add('team');
            let span4 = document.createElement('span');
            span4.classList.add('team-name');
            teamDiv2.appendChild(span4);
            rowDiv1.appendChild(teamDiv2);

            function updateTextContent() {
                if (window.innerWidth > 768) {
                    span1.textContent = rowData[1].v;
                    span4.textContent = rowData[6].v;
                } else {
                    span1.textContent = rowData[2].v;
                    span4.textContent = rowData[5].v;
                }
            }
            // Initial setup based on window width
            updateTextContent();

            // Update text content on window resize
            window.addEventListener('resize', updateTextContent);
            // Create an image element for the team logo
            let img2 = document.createElement('img');
            img2.classList.add('team-logo');
            img2.src = `https://drive.google.com/thumbnail?id=${rowData[7].v.match(regex)[1]}`; // Set the image source from the data
            img2.alt = rowData[6].v + ' Logo'; // Set the alt text based on the team name
            teamDiv2.appendChild(img2);

            if (parseInt(rowData[3].v) > parseInt(rowData[4].v)) {
                img2.classList.add('loser-darker');
                span4.classList.add('loser-darker');
                img1.classList.add('winner-brighter');
                span1.classList.add('winner-brighter');
                winnerSpan.textContent = '<'; // Set the text for winnerSpan
                loseSpan.textContent = '\u2009'; // Set the text for loseSpan
                // Add the 'winner' class
                scoreSpan.appendChild(winnerSpan);
                scoreSpan.appendChild(span2);
                scoreSpan.appendChild(gachSpan);
                scoreSpan.appendChild(span3);
                scoreSpan.appendChild(loseSpan)

            }

            else if (parseInt(rowData[3].v) < parseInt(rowData[4].v)) {
                img1.classList.add('loser-darker');
                span1.classList.add('loser-darker');
                img2.classList.add('winner-brighter');
                span4.classList.add('winner-brighter');
                winnerSpan.textContent = '>'; // Set the text for winnerSpan
                loseSpan.textContent = '\u2009'; // Set the text for loseSpan
                winnerSpan.classList.add('loser'); // Add the 'winner' class
                scoreSpan.appendChild(loseSpan)
                scoreSpan.appendChild(span2);
                scoreSpan.appendChild(gachSpan);
                scoreSpan.appendChild(span3);
                scoreSpan.appendChild(winnerSpan);
            } else {
                // No winner, just display the scores with 'gach' in the middle
                scoreSpan.appendChild(span2);
                scoreSpan.appendChild(gachSpan);
                scoreSpan.appendChild(span3);
            }

            scoreContainerDiv.appendChild(scoreSpan);
            rowDiv1.appendChild(scoreContainerDiv);


            //create score info breakdown
            let score_break_down = document.createElement('div');
            score_break_down.classList.add('wordBox1');
            let team_left = document.createElement('div');
            team_left.classList.add('team-left');
            let team1 = document.createElement('p');
            team1.classList.add('team-name');
            team1.textContent = rowData[1].v;
            team_left.appendChild(team1);

            let stat_left = document.createElement('div');
            stat_left.classList.add('stat-left');
            let kda_left = document.createElement('p');
            kda_left.classList.add('kda');
            kda_left.textContent = `K/D/A: ${rowData[15].v}/${rowData[17].v}/${rowData[19].v}`;
            stat_left.appendChild(kda_left);
            team_left.appendChild(stat_left);

            // Create table for team 1
            let table_left = createTable('team1', 'team-left-A-', i);
            team_left.appendChild(table_left);

            // Create div wrapper for table left
            let div_table_left = createDivWrapper(table_left);
            team_left.appendChild(div_table_left);
            score_break_down.appendChild(team_left);

            // Create elements for team right
            let team_right = createTeamDiv(rowData[6].v);
            let stat_right = createStatDiv(`K/D/A: ${rowData[16].v}/${rowData[18].v}/${rowData[20].v}`);
            team_right.appendChild(stat_right);

            // Create table for team 2
            let table_right = createTable('team2', 'team-right-A-', i);
            team_right.appendChild(table_right);

            // Create div wrapper for table right
            let div_table_right = createDivWrapper(table_right);
            team_right.appendChild(div_table_right);
            score_break_down.appendChild(team_right);

            // Helper functions
            function createTable(className, tbodyIdPrefix, index) {
                let table = document.createElement('table');
                table.classList.add(className);

                let thead = document.createElement('thead');
                let tr = document.createElement('tr');
                tr.classList.add('title');

                let headers = ['', 'AVG Score', 'K', 'D', 'A', 'K/D', 'ADR', 'HS', 'KAST (%)', 'FK', 'MK'];
                headers.forEach((text, idx) => {
                    let th = document.createElement('th');
                    if (idx === 0) th.classList.add("first-col");
                    th.textContent = text;
                    tr.appendChild(th);
                });

                thead.appendChild(tr);
                table.appendChild(thead);

                let tbody = document.createElement('tbody');
                const specialMatchIds = {
                    1: ['matchidA1', 'matchidA2', 'matchidA3', 'matchidA4', 'matchidB5'],
                    3: ['matchidB6'],
                    5: ['matchidB7'],
                    7: ['matchidB8'],
                    9: ['matchidC9'],
                    11: ['matchidC10']
                };

                const idToIndexIncrement = (id) => {
                    for (const [increment, ids] of Object.entries(specialMatchIds)) {
                        if (ids.includes(id)) {
                            return parseInt(increment, 10);
                        }
                    }

                    return 0; // default case if not found in any list
                }
                const increment = idToIndexIncrement(dataBody.id);
                if (increment) {
                    tbody.id = `${tbodyIdPrefix}${index + increment}`;
                }

                table.appendChild(tbody);

                return table;
            }

            function createDivWrapper(table) {
                let div = document.createElement('div');
                div.classList.add('wrapper');
                div.appendChild(table);
                return div;
            }

            function createTeamDiv(teamName) {
                let teamDiv = document.createElement('div');
                teamDiv.classList.add('team-right');
                let teamNameElem = document.createElement('p');
                teamNameElem.classList.add('team-name');
                teamNameElem.textContent = teamName;
                teamDiv.appendChild(teamNameElem);
                return teamDiv;
            }

            function createStatDiv(kdaText) {
                let statDiv = document.createElement('div');
                statDiv.classList.add('stat-right');
                let kdaElem = document.createElement('p');
                kdaElem.classList.add('kda');
                kdaElem.textContent = kdaText;
                statDiv.appendChild(kdaElem);
                return statDiv;
            }
            function show() {
                const showWordsElements = document.querySelectorAll('.row2');
                const wordBoxElements = document.querySelectorAll('.wordBox1');
                const isBoxVisible = Array.from({ length: showWordsElements.length }).fill(false);

                showWordsElements.forEach((showWords, index) => {
                    showWords.addEventListener('click', function (e) {
                        e.preventDefault();

                        if (isBoxVisible[index]) {
                            wordBoxElements[index].style.display = 'none'; // Hide the box
                        } else {
                            wordBoxElements[index].style.display = 'block'; // Show the box
                        }

                        isBoxVisible[index] = !isBoxVisible[index]; // Toggle the state
                    });
                });
            }

            // Append the team div to the row div
            rowDiv1.appendChild(teamDiv2);
            rowDiv.appendChild(rowDiv1);
            rowDiv.appendChild(score_break_down);
            link.appendChild(rowDiv)
            // Append the row div to the dataBody
            dataBody.appendChild(link);
            const specifiedMatches = [
                'B5', 'B6', 'B7', 'B8', 'C9', 'C10'
            ];
            if (specifiedMatches.includes(matchId)) {
                for (let j = 0; j < 2; j++) {
                    const rowData1 = data.table.rows[j + 1 + k].c;
                    let rowDiv = document.createElement('div');
                    rowDiv.classList.add('row2');
                    // Create a container div for each row
                    let rowDiv1 = document.createElement('div');
                    rowDiv1.classList.add('row1');

                    // Create a team div to wrap the team logo and name
                    let teamDiv1 = document.createElement('div');
                    teamDiv1.classList.add('team');

                    // Create an image element for the team logo
                    let img1 = document.createElement('img');
                    img1.classList.add('team-logo');
                    const regex = /\/d\/(.+?)\/view/;
                    img1.src = `https://drive.google.com/thumbnail?id=${data.table.rows[j + 1 + k].c[0].v.match(regex)[1]}`; // Set the image source from the data
                    img1.alt = rowData1[1].v + ' Logo'; // Set the alt text based on the team name
                    teamDiv1.appendChild(img1);
                    let span1 = document.createElement('span');
                    span1.classList.add('team-name');
                    teamDiv1.appendChild(span1);
                    rowDiv1.appendChild(teamDiv1);

                    // Create a score container div
                    let scoreContainerDiv = document.createElement('div');
                    scoreContainerDiv.classList.add('score-container');

                    // Create a parent span to group score-left, 'gach', score-right, and winner
                    let scoreSpan = document.createElement('span');
                    scoreSpan.classList.add('score');

                    let span2 = document.createElement('span');
                    span2.textContent = rowData1[3].v;
                    span2.classList.add('score-left'); // Add the 'score-left' class

                    let gachSpan = document.createElement('span');
                    gachSpan.textContent = '-';
                    gachSpan.classList.add('gach'); // Add the 'gach' class

                    let span3 = document.createElement('span');
                    span3.textContent = rowData1[4].v;
                    span3.classList.add('score-right'); // Add the 'score-right' class

                    let winnerSpan = document.createElement('span');
                    let loseSpan = document.createElement('span');
                    winnerSpan.classList.add('winner');
                    loseSpan.classList.add('loser');
                    // Check for the winner condition

                    // Create a team div to wrap the team name and logo
                    let teamDiv2 = document.createElement('div');
                    teamDiv2.classList.add('team');
                    let span4 = document.createElement('span');
                    span4.classList.add('team-name');
                    teamDiv2.appendChild(span4);
                    rowDiv1.appendChild(teamDiv2);

                    function updateTextContent() {
                        if (window.innerWidth > 768) {
                            span1.textContent = rowData1[1].v;
                            span4.textContent = rowData1[6].v;
                        } else {
                            span1.textContent = rowData1[2].v;
                            span4.textContent = rowData1[5].v;
                        }
                    }
                    // Initial setup based on window width
                    updateTextContent();

                    // Update text content on window resize
                    window.addEventListener('resize', updateTextContent);
                    // Create an image element for the team logo
                    let img2 = document.createElement('img');
                    img2.classList.add('team-logo');
                    img2.src = `https://drive.google.com/thumbnail?id=${rowData1[7].v.match(regex)[1]}`; // Set the image source from the data
                    img2.alt = rowData1[6].v + ' Logo'; // Set the alt text based on the team name
                    teamDiv2.appendChild(img2);

                    if (parseInt(rowData1[3].v) > parseInt(rowData1[4].v)) {
                        img2.classList.add('loser-darker');
                        span4.classList.add('loser-darker');
                        img1.classList.add('winner-brighter');
                        span1.classList.add('winner-brighter');
                        winnerSpan.textContent = '<'; // Set the text for winnerSpan
                        loseSpan.textContent = '\u2009'; // Set the text for loseSpan
                        // Add the 'winner' class
                        scoreSpan.appendChild(winnerSpan);
                        scoreSpan.appendChild(span2);
                        scoreSpan.appendChild(gachSpan);
                        scoreSpan.appendChild(span3);
                        scoreSpan.appendChild(loseSpan)

                    }

                    else if (parseInt(rowData1[3].v) < parseInt(rowData1[4].v)) {
                        img1.classList.add('loser-darker');
                        span1.classList.add('loser-darker');
                        img2.classList.add('winner-brighter');
                        span4.classList.add('winner-brighter');
                        winnerSpan.textContent = '>'; // Set the text for winnerSpan
                        loseSpan.textContent = '\u2009'; // Set the text for loseSpan
                        winnerSpan.classList.add('loser'); // Add the 'winner' class
                        scoreSpan.appendChild(loseSpan)
                        scoreSpan.appendChild(span2);
                        scoreSpan.appendChild(gachSpan);
                        scoreSpan.appendChild(span3);
                        scoreSpan.appendChild(winnerSpan);
                    } else {
                        // No winner, just display the scores with 'gach' in the middle
                        scoreSpan.appendChild(span2);
                        scoreSpan.appendChild(gachSpan);
                        scoreSpan.appendChild(span3);
                    }

                    scoreContainerDiv.appendChild(scoreSpan);
                    rowDiv1.appendChild(scoreContainerDiv);


                    //create score info breakdown
                    let score_break_down = document.createElement('div');
                    score_break_down.classList.add('wordBox1');
                    let team_left = document.createElement('div');
                    team_left.classList.add('team-left');
                    let team1 = document.createElement('p');
                    team1.classList.add('team-name');
                    team1.textContent = rowData1[1].v;
                    team_left.appendChild(team1);

                    let stat_left = document.createElement('div');
                    stat_left.classList.add('stat-left');
                    let kda_left = document.createElement('p');
                    kda_left.classList.add('kda');
                    kda_left.textContent = `K/D/A: ${rowData1[15].v}/${rowData1[17].v}/${rowData1[19].v}`;
                    stat_left.appendChild(kda_left);
                    team_left.appendChild(stat_left);

                    // Create table for team 1
                    let table_left = createTable('team1', 'team-left-A-', j + 1 + i);
                    team_left.appendChild(table_left);

                    // Create div wrapper for table left
                    let div_table_left = createDivWrapper(table_left);
                    team_left.appendChild(div_table_left);
                    score_break_down.appendChild(team_left);

                    // Create elements for team right
                    let team_right = createTeamDiv(rowData1[6].v);
                    let stat_right = createStatDiv(`K/D/A: ${rowData1[16].v}/${rowData1[18].v}/${rowData1[20].v}`);
                    team_right.appendChild(stat_right);

                    // Create table for team 2
                    let table_right = createTable('team2', 'team-right-A-', j + 1 + i);
                    team_right.appendChild(table_right);

                    // Create div wrapper for table right
                    let div_table_right = createDivWrapper(table_right);
                    team_right.appendChild(div_table_right);
                    score_break_down.appendChild(team_right);
                    rowDiv1.appendChild(teamDiv2);
                    rowDiv.appendChild(rowDiv1);
                    rowDiv.appendChild(score_break_down);
                    link.appendChild(rowDiv)
                    // Append the row div to the dataBody
                    dataBody.appendChild(link);
                    show();
                }

            }


        }
        setData(data);
    }



    return (
        <>
            <div className="next">
                <Link to="/valorant/playoff">Play-off &gt;</Link>
            </div>
            <h2 style={{ textAlign: 'center', fontWeight: 900 }}>SWISS STAGE</h2>
            <section className="swissbracket">
                <div className="vong1">
                    <div className="matchuppair">
                        <div className="w0-l0">
                            <div className="title">
                                <p className="title-vong-1">0W - 0L</p>
                            </div>
                        </div>
                    </div>
                    <div className="connection-line">
                        <div className="line"></div>
                        <div className="merger"></div>
                    </div>
                </div>

                <div className="vong2">
                    <div className="matchuppair">
                        <div className="w1-l0">
                            <div className="title">
                                <p className="title-vong-2">1W - 0L</p>
                            </div>
                        </div>
                        <div className="w0-l1">
                            <div className="title">
                                <p className="title-vong-2">0W - 1L</p>
                            </div>
                        </div>
                    </div>
                    <div className="connection-line">
                        <div className="adv-line">
                            <div className="line"></div>
                        </div>
                        <div className="connection1">
                            <div className="merger"></div>
                            <div className="line"></div>
                        </div>
                        <div className="eli-line">
                            <div className="line"></div>
                        </div>
                    </div>
                </div>

                <div className="vong3">
                    <div className="matchuppair">
                        <div className="w1-l1">
                            <div className="title">
                                <p className="title-vong-3">1W - 1L</p>
                            </div>
                        </div>
                    </div>
                    <div className="connection1">
                        <div className="line"></div>
                    </div>
                    <div className="eli-line">
                        <div className="line"></div>
                    </div>
                </div>

                <div className="adva-eli">
                    <div className="teams">
                        <div className="advance">
                            <div className="title">
                                <p className="title-advance">Advance to play-off</p>
                            </div>
                        </div>
                        <div className="eliminate">
                            <div className="title">
                                <p className="title-eliminate">Eliminate</p>
                            </div>
                            <div className="eliminate-teams"></div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
